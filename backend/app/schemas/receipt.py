from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, Field


class ParsedReceiptItem(BaseModel):
    name: str

    quantity: Decimal = Field(
        default=Decimal("1"),
        gt=0,
    )

    unit_price: Decimal | None = Field(
        default=None,
        ge=0,
    )

    amount: Decimal = Field(
        ge=0,
    )


class ParsedReceipt(BaseModel):
    merchant: str | None = None

    receipt_date: date | None = None

    receipt_time: time | None = None

    reference_number: str | None = None

    items: list[ParsedReceiptItem] = Field(
        default_factory=list,
    )

    subtotal: Decimal | None = Field(
        default=None,
        ge=0,
    )

    tax: Decimal | None = Field(
        default=None,
        ge=0,
    )

    discount: Decimal | None = Field(
        default=None,
        ge=0,
    )

    total: Decimal | None = Field(
        default=None,
        ge=0,
    )

    payment_method: str | None = None

    amount_tendered: Decimal | None = Field(
        default=None,
        ge=0,
    )

    change: Decimal | None = Field(
        default=None,
        ge=0,
    )

    parser_confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
    )

    warnings: list[str] = Field(
        default_factory=list,
    )


class ReceiptParseResponse(BaseModel):
    draft_id: str
    original_filename: str
    parsed: ParsedReceipt


class ReceiptConfirmItem(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=255,
    )

    quantity: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=3,
    )

    unit_price: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=2,
    )


class ReceiptConfirmRequest(BaseModel):
    draft_id: str = Field(
        min_length=1,
    )

    merchant: str | None = Field(
        default=None,
        max_length=255,
    )

    receipt_date: date

    items: list[ReceiptConfirmItem] = Field(
        min_length=1,
    )

    total: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2,
    )

    category: str | None = Field(
        default=None,
        max_length=100,
    )

    note: str | None = None


class ReceiptConfirmedItemResponse(BaseModel):
    id: int
    name: str
    quantity: Decimal
    unit_price: Decimal


class ReceiptConfirmResponse(BaseModel):
    receipt_id: int
    expense_id: int
    merchant: str | None
    receipt_date: date
    total: Decimal
    category: str | None
    note: str | None
    items: list[ReceiptConfirmedItemResponse]
    status: str


class ReceiptListItemResponse(BaseModel):
    id: int

    merchant: str | None

    receipt_date: date

    total: Decimal | None

    category: str | None

    status: str

    created_at: datetime


class ReceiptListResponse(BaseModel):
    receipts: list[ReceiptListItemResponse]


class ReceiptDetailItemResponse(BaseModel):
    id: int

    name: str

    quantity: Decimal

    unit_price: Decimal


class ReceiptOCRInfoResponse(BaseModel):
    receipt_time: time | None = None

    reference_number: str | None = None

    subtotal: Decimal | None = None

    tax: Decimal | None = None

    discount: Decimal | None = None

    payment_method: str | None = None

    amount_tendered: Decimal | None = None

    change: Decimal | None = None

    parser_confidence: float | None = None

    warnings: list[str] = Field(
        default_factory=list,
    )


class ReceiptDetailResponse(BaseModel):
    id: int

    merchant: str | None

    receipt_date: date

    status: str

    image_url: str

    total: Decimal | None

    category: str | None

    note: str | None

    items: list[ReceiptDetailItemResponse]

    ocr: ReceiptOCRInfoResponse | None

    created_at: datetime

    updated_at: datetime