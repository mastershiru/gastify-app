from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import settings
from app.db.base import Base

# Import every model so it is registered in Base.metadata.
from app.db.models import (
    Expense,
    PushToken,
    Receipt,
    ReceiptItem,
    SavingsTransaction,
    User,
)


config = context.config


def get_alembic_database_url() -> str:
    """
    Return a synchronous database URL for Alembic.

    The Gastify application uses SQLAlchemy async connections:
        sqlite+aiosqlite
        postgresql+asyncpg

    Alembic's migration environment uses a synchronous engine.
    """

    database_url = settings.DATABASE_URL

    if database_url.startswith("sqlite+aiosqlite://"):
        return database_url.replace(
            "sqlite+aiosqlite://",
            "sqlite://",
            1,
        )

    if database_url.startswith("postgresql+asyncpg://"):
        return database_url.replace(
            "postgresql+asyncpg://",
            "postgresql+psycopg://",
            1,
        )

    return database_url


config.set_main_option(
    "sqlalchemy.url",
    get_alembic_database_url(),
)


if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named",
        },
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(
        config.config_ini_section,
        {},
    )

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()