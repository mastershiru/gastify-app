import shutil
import tempfile
from pathlib import Path

from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile,
)
from starlette.concurrency import run_in_threadpool

from app.schemas.ocr import OCRResponse
from app.schemas.receipt import ParsedReceipt
from app.services.ocr_service import ocr_service
from app.services.receipt_parser import receipt_parser


router = APIRouter(
    prefix="/ocr",
    tags=["OCR"],
)


ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


def validate_upload(
    file: UploadFile,
) -> None:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                "Unsupported image type. "
                "Use JPEG, PNG, or WebP."
            ),
        )


async def save_upload_to_temp(
    file: UploadFile,
) -> tuple[Path, str]:
    original_filename = (
        file.filename
        or "receipt.jpg"
    )

    suffix = (
        Path(original_filename).suffix
        or ".jpg"
    )

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix,
    ) as temp_file:
        shutil.copyfileobj(
            file.file,
            temp_file,
        )

        temp_path = Path(
            temp_file.name
        )

    return (
        temp_path,
        original_filename,
    )


@router.post(
    "/test",
    response_model=OCRResponse,
)
async def test_ocr(
    file: UploadFile = File(...),
) -> OCRResponse:
    validate_upload(file)

    temp_path: Path | None = None

    try:
        (
            temp_path,
            original_filename,
        ) = await save_upload_to_temp(
            file
        )

        result = await run_in_threadpool(
            ocr_service.extract_text,
            temp_path,
        )

        return OCRResponse(
            provider=result["provider"],
            filename=original_filename,
            text=result["text"],
            average_confidence=result[
                "average_confidence"
            ],
            lines=result["lines"],
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "OCR processing failed: "
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
    "/test-parse",
    response_model=ParsedReceipt,
)
async def test_receipt_parser(
    file: UploadFile = File(...),
) -> ParsedReceipt:
    """
    Development endpoint for testing the complete
    OCR -> receipt parser pipeline.

    This endpoint does not save anything to the
    database.
    """

    validate_upload(file)

    temp_path: Path | None = None

    try:
        (
            temp_path,
            _,
        ) = await save_upload_to_temp(
            file
        )

        ocr_result = await run_in_threadpool(
            ocr_service.extract_text,
            temp_path,
        )

        parsed_receipt = (
            await run_in_threadpool(
                receipt_parser.parse,
                ocr_result,
            )
        )

        return parsed_receipt

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Receipt parsing failed: "
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