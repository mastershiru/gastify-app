"""allow fractional receipt item quantities

Revision ID: ebbe367af2d8
Revises: 553f15e6bbe8
Create Date: 2026-09-24 16:51:35.284733

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "ebbe367af2d8"
down_revision: Union[str, Sequence[str], None] = "553f15e6bbe8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Change receipt item quantity from INTEGER to NUMERIC(12, 3).

    SQLite does not support ALTER COLUMN in the same way as
    PostgreSQL, so Alembic batch mode is used to safely recreate
    the table while preserving existing data.
    """

    with op.batch_alter_table(
        "receipt_items",
        schema=None,
    ) as batch_op:
        batch_op.alter_column(
            "qty",
            existing_type=sa.Integer(),
            type_=sa.Numeric(
                precision=12,
                scale=3,
            ),
            existing_nullable=False,
            existing_server_default=sa.text("'1'"),
            server_default=sa.text("'1.000'"),
        )


def downgrade() -> None:
    """
    Restore receipt item quantity to INTEGER.

    Fractional quantities will lose their fractional component if
    this migration is downgraded after fractional data has already
    been stored.
    """

    with op.batch_alter_table(
        "receipt_items",
        schema=None,
    ) as batch_op:
        batch_op.alter_column(
            "qty",
            existing_type=sa.Numeric(
                precision=12,
                scale=3,
            ),
            type_=sa.Integer(),
            existing_nullable=False,
            existing_server_default=sa.text("'1.000'"),
            server_default=sa.text("'1'"),
        )