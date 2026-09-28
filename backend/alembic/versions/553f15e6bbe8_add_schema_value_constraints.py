"""add schema value constraints

Revision ID: 553f15e6bbe8
Revises: e8f7db01f3ad
Create Date: 2026-09-23 15:38:22.079947
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "553f15e6bbe8"
down_revision: Union[str, Sequence[str], None] = "e8f7db01f3ad"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add allowed-value check constraints."""

    with op.batch_alter_table("receipts") as batch_op:
        batch_op.create_check_constraint(
            "ck_receipts_status",
            "status IN ('pending_review', 'confirmed')",
        )

    with op.batch_alter_table("expenses") as batch_op:
        batch_op.create_check_constraint(
            "ck_expenses_source",
            "source IN ('receipt', 'manual')",
        )

    with op.batch_alter_table("savings_transactions") as batch_op:
        batch_op.create_check_constraint(
            "ck_savings_transactions_type",
            "type IN ('deposit', 'withdraw')",
        )


def downgrade() -> None:
    """Remove allowed-value check constraints."""

    with op.batch_alter_table("savings_transactions") as batch_op:
        batch_op.drop_constraint(
            "ck_savings_transactions_type",
            type_="check",
        )

    with op.batch_alter_table("expenses") as batch_op:
        batch_op.drop_constraint(
            "ck_expenses_source",
            type_="check",
        )

    with op.batch_alter_table("receipts") as batch_op:
        batch_op.drop_constraint(
            "ck_receipts_status",
            type_="check",
        )