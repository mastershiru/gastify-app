from fastapi import FastAPI

from app.api.v1.auth import router as auth_router
from app.api.v1.expenses import router as expenses_router
from app.api.v1.ocr import router as ocr_router
from app.api.v1.receipts import router as receipts_router
from app.core.config import settings


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
)


app.include_router(
    auth_router,
    prefix="/api/v1",
)

app.include_router(
    ocr_router,
    prefix="/api/v1",
)

app.include_router(
    receipts_router,
    prefix="/api/v1",
)

app.include_router(
    expenses_router,
    prefix="/api/v1",
)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
    }
