from pydantic import BaseModel, Field


class OCRLine(BaseModel):
    text: str
    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )
    box: list[int] | None = None


class OCRResponse(BaseModel):
    provider: str
    filename: str
    text: str
    average_confidence: float | None
    lines: list[OCRLine]