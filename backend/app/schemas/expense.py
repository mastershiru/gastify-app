from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ManualExpenseCreateRequest(BaseModel):
    amount: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2,
    )
    date: date
    category: str | None = Field(
        default=None,
        max_length=100,
    )
    note: str | None = Field(
        default=None,
        max_length=2000,
    )

    @field_validator("category", "note")
    @classmethod
    def normalize_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        normalized = value.strip()

        return normalized or None


class ExpenseResponse(BaseModel):
    id: int
    amount: Decimal
    date: date
    category: str | None
    note: str | None
    source: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    page: int
    page_size: int
