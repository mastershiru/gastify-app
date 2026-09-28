from pathlib import Path
from typing import Any

from paddleocr import PaddleOCR


class OCRService:
    def __init__(self) -> None:
        self._engine: PaddleOCR | None = None

    def _get_engine(self) -> PaddleOCR:
        """
        Lazily initialize PaddleOCR.

        MKLDNN/oneDNN is explicitly disabled on CPU because
        PaddlePaddle 3.3.1 + PaddleOCR 3.7.0 on Windows can fail
        during prediction with:
        ConvertPirAttribute2RuntimeAttribute not support
        [pir::ArrayAttribute<pir::DoubleAttribute>]
        """

        if self._engine is None:
            self._engine = PaddleOCR(
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
                enable_mkldnn=False,
                engine="paddle",
            )

        return self._engine

    @staticmethod
    def _to_python(value: Any) -> Any:
        """
        Convert NumPy-like values returned by PaddleOCR to regular
        Python values when necessary.
        """

        if hasattr(value, "tolist"):
            return value.tolist()

        return value

    def extract_text(
        self,
        image_path: str | Path,
    ) -> dict[str, Any]:
        path = Path(image_path)

        if not path.exists():
            raise FileNotFoundError(
                f"OCR input file does not exist: {path}"
            )

        engine = self._get_engine()

        prediction_results = engine.predict(
            str(path),
        )

        lines: list[dict[str, Any]] = []
        combined_text: list[str] = []
        confidence_values: list[float] = []

        for result in prediction_results:
            result_json = result.json

            if not isinstance(result_json, dict):
                continue

            payload = result_json.get(
                "res",
                result_json,
            )

            texts = self._to_python(
                payload.get("rec_texts", [])
            )

            scores = self._to_python(
                payload.get("rec_scores", [])
            )

            boxes = self._to_python(
                payload.get("rec_boxes", [])
            )

            if not isinstance(texts, list):
                texts = []

            if not isinstance(scores, list):
                scores = []

            if not isinstance(boxes, list):
                boxes = []

            for index, raw_text in enumerate(texts):
                text = str(raw_text).strip()

                if not text:
                    continue

                confidence = (
                    float(scores[index])
                    if index < len(scores)
                    else 0.0
                )

                box = (
                    boxes[index]
                    if index < len(boxes)
                    else None
                )

                if isinstance(box, list):
                    box = [
                        int(value)
                        for value in box
                    ]
                else:
                    box = None

                lines.append(
                    {
                        "text": text,
                        "confidence": confidence,
                        "box": box,
                    }
                )

                combined_text.append(text)
                confidence_values.append(
                    confidence
                )

        average_confidence = None

        if confidence_values:
            average_confidence = (
                sum(confidence_values)
                / len(confidence_values)
            )

        return {
            "provider": "paddleocr",
            "text": "\n".join(combined_text),
            "average_confidence": average_confidence,
            "lines": lines,
        }


ocr_service = OCRService()