import json
import shutil
import tempfile
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.api.v1.auth import get_current_user
from app.db.models.expense import Expense
from app.db.models.receipt import Receipt
from app.db.models.receipt_item import ReceiptItem
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.receipt import (
    ReceiptConfirmRequest,
    ReceiptConfirmResponse,
    ReceiptConfirmedItemResponse,
    ReceiptDetailItemResponse,
    ReceiptDetailResponse,
    ReceiptListItemResponse,
    ReceiptListResponse,
    ReceiptOCRInfoResponse,
    ReceiptParseResponse,
)
from app.services.ocr_service import ocr_service
from app.services.receipt_parser import receipt_parser


router = APIRouter(
    prefix="/receipts",
    tags=["Receipts"],
)


ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


CONTENT_TYPE_SUFFIXES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


MAX_UPLOAD_SIZE = 10 * 1024 * 1024


STORAGE_ROOT = (
    Path(__file__).resolve().parents[3]
    / "storage"
)

DRAFT_STORAGE_ROOT = (
    STORAGE_ROOT
    / "receipt_drafts"
)

RECEIPT_STORAGE_ROOT = (
    STORAGE_ROOT
    / "receipts"
)


def validate_upload(
    file: UploadFile,
) -> None:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                "Unsupported image type. "
                "Use JPEG, PNG, or WebP."
            ),
        )


async def save_upload_to_temp(
    file: UploadFile,
) -> Path:
    content_type = (
        file.content_type
        or ""
    )

    suffix = CONTENT_TYPE_SUFFIXES.get(
        content_type,
        ".jpg",
    )

    temp_path: Path | None = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
        ) as temp_file:
            temp_path = Path(
                temp_file.name
            )

            total_size = 0

            while True:
                chunk = await file.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > MAX_UPLOAD_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=(
                            "Receipt image is too large. "
                            "Maximum upload size is 10 MB."
                        ),
                    )

                temp_file.write(chunk)

        if (
            temp_path is None
            or not temp_path.exists()
        ):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Unable to prepare receipt image "
                    "for processing."
                ),
            )

        if temp_path.stat().st_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Receipt image is empty.",
            )

        return temp_path

    except Exception:
        if (
            temp_path is not None
            and temp_path.exists()
        ):
            temp_path.unlink(
                missing_ok=True
            )

        raise


def persist_receipt_draft(
    *,
    user_id: int,
    draft_id: str,
    temp_path: Path,
    content_type: str,
    original_filename: str,
    ocr_result: dict,
) -> None:
    suffix = CONTENT_TYPE_SUFFIXES.get(
        content_type,
        ".jpg",
    )

    draft_directory = (
        DRAFT_STORAGE_ROOT
        / str(user_id)
        / draft_id
    )

    draft_directory.mkdir(
        parents=True,
        exist_ok=False,
    )

    image_path = (
        draft_directory
        / f"source{suffix}"
    )

    metadata_path = (
        draft_directory
        / "ocr.json"
    )

    try:
        shutil.copy2(
            temp_path,
            image_path,
        )

        metadata = {
            "draft_id": draft_id,
            "user_id": user_id,
            "original_filename": (
                original_filename
            ),
            "content_type": content_type,
            "image_filename": (
                image_path.name
            ),
            "ocr_result": ocr_result,
        }

        metadata_path.write_text(
            json.dumps(
                metadata,
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

    except Exception:
        shutil.rmtree(
            draft_directory,
            ignore_errors=True,
        )

        raise


def load_receipt_draft(
    *,
    user_id: int,
    draft_id: str,
) -> tuple[
    Path,
    Path,
    dict,
]:
    try:
        UUID(draft_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid receipt draft ID.",
        ) from exc

    draft_directory = (
        DRAFT_STORAGE_ROOT
        / str(user_id)
        / draft_id
    )

    metadata_path = (
        draft_directory
        / "ocr.json"
    )

    if not metadata_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Receipt draft was not found "
                "or does not belong to this user."
            ),
        )

    try:
        metadata = json.loads(
            metadata_path.read_text(
                encoding="utf-8",
            )
        )
    except (
        OSError,
        json.JSONDecodeError,
    ) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Receipt draft metadata "
                "could not be read."
            ),
        ) from exc

    if metadata.get(
        "user_id"
    ) != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Receipt draft was not found "
                "or does not belong to this user."
            ),
        )

    image_filename = metadata.get(
        "image_filename"
    )

    if (
        not isinstance(
            image_filename,
            str,
        )
        or not image_filename
    ):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Receipt draft image metadata "
                "is invalid."
            ),
        )

    image_path = (
        draft_directory
        / Path(
            image_filename
        ).name
    )

    if not image_path.exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Receipt draft image "
                "could not be found."
            ),
        )

    return (
        draft_directory,
        image_path,
        metadata,
    )


def move_draft_image_to_permanent_storage(
    *,
    user_id: int,
    draft_id: str,
    draft_image_path: Path,
) -> tuple[
    Path,
    str,
]:
    destination_directory = (
        RECEIPT_STORAGE_ROOT
        / str(user_id)
        / draft_id
    )

    destination_directory.mkdir(
        parents=True,
        exist_ok=False,
    )

    destination_path = (
        destination_directory
        / draft_image_path.name
    )

    shutil.copy2(
        draft_image_path,
        destination_path,
    )

    relative_path = (
        destination_path
        .relative_to(
            STORAGE_ROOT
        )
        .as_posix()
    )

    return (
        destination_directory,
        relative_path,
    )


@router.get(
    "",
    response_model=ReceiptListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_receipts(
    current_user: User = Depends(
        get_current_user
    ),
    db: AsyncSession = Depends(
        get_db
    ),
) -> ReceiptListResponse:
    """
    Return confirmed receipts owned by the authenticated user.

    Results are ordered newest first.
    """

    result = await db.execute(
        select(
            Receipt,
            Expense,
        )
        .outerjoin(
            Expense,
            Expense.receipt_id
            == Receipt.id,
        )
        .where(
            Receipt.user_id
            == current_user.id
        )
        .order_by(
            Receipt.receipt_date.desc(),
            Receipt.created_at.desc(),
            Receipt.id.desc(),
        )
    )

    rows = result.all()

    return ReceiptListResponse(
        receipts=[
            ReceiptListItemResponse(
                id=receipt.id,
                merchant=receipt.merchant,
                receipt_date=(
                    receipt.receipt_date
                ),
                total=(
                    expense.amount
                    if expense
                    is not None
                    else None
                ),
                category=(
                    expense.category
                    if expense
                    is not None
                    else None
                ),
                status=receipt.status,
                created_at=(
                    receipt.created_at
                ),
            )
            for receipt, expense
            in rows
        ]
    )


@router.delete(
    "/{receipt_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_receipt(
    receipt_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: AsyncSession = Depends(
        get_db
    ),
) -> None:
    """Delete one authenticated user's receipt and its linked expense."""

    result = await db.execute(
        select(Receipt)
        .where(
            Receipt.id == receipt_id,
            Receipt.user_id == current_user.id,
        )
    )

    receipt = result.scalar_one_or_none()

    if receipt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found.",
        )

    storage_directory = (
        STORAGE_ROOT
        / Path(receipt.image_url)
    ).parent

    try:
        storage_directory.relative_to(
            RECEIPT_STORAGE_ROOT
        )
    except ValueError:
        storage_directory = None

    expense_result = await db.execute(
        select(Expense)
        .where(
            Expense.receipt_id == receipt.id
        )
    )

    expense = expense_result.scalar_one_or_none()

    if expense is not None:
        await db.delete(expense)

    await db.delete(receipt)
    await db.commit()

    if (
        storage_directory is not None
        and storage_directory.exists()
    ):
        try:
            await run_in_threadpool(
                shutil.rmtree,
                storage_directory,
            )
        except OSError:
            # The database record is gone; a stale private
            # file can be handled by storage cleanup later.
            pass


@router.get(
    "/{receipt_id}",
    response_model=ReceiptDetailResponse,
    status_code=status.HTTP_200_OK,
)
async def get_receipt_detail(
    receipt_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: AsyncSession = Depends(
        get_db
    ),
) -> ReceiptDetailResponse:
    """
    Return one receipt owned by the authenticated user.

    A receipt owned by another user is deliberately returned as
    404 rather than revealing that the record exists.
    """

    receipt_result = await db.execute(
        select(
            Receipt,
            Expense,
        )
        .outerjoin(
            Expense,
            Expense.receipt_id
            == Receipt.id,
        )
        .where(
            Receipt.id
            == receipt_id,
            Receipt.user_id
            == current_user.id,
        )
    )

    row = (
        receipt_result
        .first()
    )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found.",
        )

    receipt, expense = row

    items_result = await db.execute(
        select(
            ReceiptItem
        )
        .where(
            ReceiptItem.receipt_id
            == receipt.id
        )
        .order_by(
            ReceiptItem.id.asc()
        )
    )

    items = (
        items_result
        .scalars()
        .all()
    )

    ocr_info: (
        ReceiptOCRInfoResponse
        | None
    ) = None

    if isinstance(
        receipt.raw_ocr_json,
        dict,
    ):
        try:
            parsed_ocr = (
                await run_in_threadpool(
                    receipt_parser.parse,
                    receipt.raw_ocr_json,
                )
            )

            ocr_info = (
                ReceiptOCRInfoResponse(
                    receipt_time=(
                        parsed_ocr
                        .receipt_time
                    ),
                    reference_number=(
                        parsed_ocr
                        .reference_number
                    ),
                    subtotal=(
                        parsed_ocr
                        .subtotal
                    ),
                    tax=(
                        parsed_ocr.tax
                    ),
                    discount=(
                        parsed_ocr
                        .discount
                    ),
                    payment_method=(
                        parsed_ocr
                        .payment_method
                    ),
                    amount_tendered=(
                        parsed_ocr
                        .amount_tendered
                    ),
                    change=(
                        parsed_ocr
                        .change
                    ),
                    parser_confidence=(
                        parsed_ocr
                        .parser_confidence
                    ),
                    warnings=(
                        parsed_ocr
                        .warnings
                    ),
                )
            )

        except Exception:
            # Receipt data remains usable even if historic
            # OCR metadata can no longer be interpreted.
            ocr_info = None

    return ReceiptDetailResponse(
        id=receipt.id,
        merchant=receipt.merchant,
        receipt_date=(
            receipt.receipt_date
        ),
        status=receipt.status,
        image_url=receipt.image_url,
        total=(
            expense.amount
            if expense is not None
            else None
        ),
        category=(
            expense.category
            if expense is not None
            else None
        ),
        note=(
            expense.note
            if expense is not None
            else None
        ),
        items=[
            ReceiptDetailItemResponse(
                id=item.id,
                name=item.name,
                quantity=item.qty,
                unit_price=item.price,
            )
            for item in items
        ],
        ocr=ocr_info,
        created_at=(
            receipt.created_at
        ),
        updated_at=(
            receipt.updated_at
        ),
    )


@router.post(
    "/parse",
    response_model=ReceiptParseResponse,
    status_code=status.HTTP_200_OK,
)
async def parse_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
) -> ReceiptParseResponse:
    validate_upload(file)

    temp_path: Path | None = None

    original_filename = (
        file.filename
        or "receipt.jpg"
    )

    content_type = (
        file.content_type
        or "image/jpeg"
    )

    draft_id = str(
        uuid4()
    )

    try:
        temp_path = await save_upload_to_temp(
            file
        )

        ocr_result = await run_in_threadpool(
            ocr_service.extract_text,
            temp_path,
        )

        parsed_receipt = await run_in_threadpool(
            receipt_parser.parse,
            ocr_result,
        )

        await run_in_threadpool(
            persist_receipt_draft,
            user_id=current_user.id,
            draft_id=draft_id,
            temp_path=temp_path,
            content_type=content_type,
            original_filename=original_filename,
            ocr_result=ocr_result,
        )

        return ReceiptParseResponse(
            draft_id=draft_id,
            original_filename=original_filename,
            parsed=parsed_receipt,
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Receipt processing failed: "
                f"{exc}"
            ),
        ) from exc

    finally:
        await file.close()

        if (
            temp_path is not None
            and temp_path.exists()
        ):
            temp_path.unlink(
                missing_ok=True
            )


@router.post(
    "/confirm",
    response_model=ReceiptConfirmResponse,
    status_code=status.HTTP_201_CREATED,
)
async def confirm_receipt(
    payload: ReceiptConfirmRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: AsyncSession = Depends(
        get_db
    ),
) -> ReceiptConfirmResponse:
    """
    Confirm an edited receipt draft.

    Creates the confirmed receipt, its items, and the linked
    expense in one database transaction.
    """

    (
        draft_directory,
        draft_image_path,
        metadata,
    ) = await run_in_threadpool(
        load_receipt_draft,
        user_id=current_user.id,
        draft_id=payload.draft_id,
    )

    permanent_directory: (
        Path
        | None
    ) = None

    try:
        (
            permanent_directory,
            stored_image_path,
        ) = await run_in_threadpool(
            move_draft_image_to_permanent_storage,
            user_id=current_user.id,
            draft_id=payload.draft_id,
            draft_image_path=draft_image_path,
        )

        raw_ocr_json = metadata.get(
            "ocr_result"
        )

        receipt = Receipt(
            user_id=current_user.id,
            image_url=stored_image_path,
            merchant=(
                payload.merchant.strip()
                if payload.merchant
                else None
            ),
            receipt_date=(
                payload.receipt_date
            ),
            status="confirmed",
            raw_ocr_json=(
                raw_ocr_json
                if isinstance(
                    raw_ocr_json,
                    dict,
                )
                else None
            ),
        )

        db.add(receipt)

        await db.flush()

        created_items: list[
            ReceiptItem
        ] = []

        for item_payload in payload.items:
            item = ReceiptItem(
                receipt_id=receipt.id,
                name=(
                    item_payload
                    .name
                    .strip()
                ),
                price=(
                    item_payload
                    .unit_price
                ),
                qty=(
                    item_payload
                    .quantity
                ),
            )

            db.add(item)

            created_items.append(
                item
            )

        expense = Expense(
            user_id=current_user.id,
            receipt_id=receipt.id,
            amount=payload.total,
            date=payload.receipt_date,
            category=(
                payload.category.strip()
                if payload.category
                else None
            ),
            note=(
                payload.note.strip()
                if payload.note
                else None
            ),
            source="receipt",
        )

        db.add(expense)

        await db.flush()

        await db.commit()

        await db.refresh(
            receipt
        )

        await db.refresh(
            expense
        )

        for item in created_items:
            await db.refresh(
                item
            )

    except HTTPException:
        await db.rollback()

        if (
            permanent_directory
            is not None
        ):
            shutil.rmtree(
                permanent_directory,
                ignore_errors=True,
            )

        raise

    except Exception as exc:
        await db.rollback()

        if (
            permanent_directory
            is not None
        ):
            shutil.rmtree(
                permanent_directory,
                ignore_errors=True,
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Receipt confirmation failed: "
                f"{exc}"
            ),
        ) from exc

    try:
        await run_in_threadpool(
            shutil.rmtree,
            draft_directory,
        )
    except Exception:
        # Database confirmation already succeeded.
        # A stale draft can be cleaned up later.
        pass

    return ReceiptConfirmResponse(
        receipt_id=receipt.id,
        expense_id=expense.id,
        merchant=receipt.merchant,
        receipt_date=(
            receipt.receipt_date
        ),
        total=expense.amount,
        category=expense.category,
        note=expense.note,
        items=[
            ReceiptConfirmedItemResponse(
                id=item.id,
                name=item.name,
                quantity=item.qty,
                unit_price=item.price,
            )
            for item
            in created_items
        ],
        status=receipt.status,
    )
