from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.expense import Expense
    from app.db.models.push_token import PushToken
    from app.db.models.receipt import Receipt
    from app.db.models.savings_transaction import SavingsTransaction


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    username: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    receipts: Mapped[list["Receipt"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    expenses: Mapped[list["Expense"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    savings_transactions: Mapped[list["SavingsTransaction"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    push_tokens: Mapped[list["PushToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )