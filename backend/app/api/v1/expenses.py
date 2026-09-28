from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.db.models.expense import Expense
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.expense import (
    ExpenseResponse,
    ExpenseListResponse,
    ManualExpenseCreateRequest,
)


router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"],
)


@router.get(
    "",
    response_model=ExpenseListResponse,
)
async def list_expenses(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseListResponse:
    """Return the current user's expenses, newest expense date first."""

    result = await db.execute(
        select(Expense)
        .where(Expense.user_id == current_user.id)
        .order_by(
            Expense.date.desc(),
            Expense.created_at.desc(),
            Expense.id.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    expenses = result.scalars().all()

    return ExpenseListResponse(
        expenses=[
            ExpenseResponse.model_validate(expense)
            for expense in expenses
        ],
        page=page,
        page_size=page_size,
    )


@router.post(
    "/manual",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_manual_expense(
    payload: ManualExpenseCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseResponse:
    """Create a user-owned expense that has no receipt attachment."""

    expense = Expense(
        user_id=current_user.id,
        amount=payload.amount,
        date=payload.date,
        category=payload.category,
        note=payload.note,
        source="manual",
    )

    db.add(expense)
    await db.commit()
    await db.refresh(expense)

    return ExpenseResponse.model_validate(expense)
