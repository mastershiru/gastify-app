import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from difflib import SequenceMatcher
from typing import Any

from app.schemas.receipt import (
    ParsedReceipt,
    ParsedReceiptItem,
)


class ReceiptParser:
    """
    Convert normalized OCR output into a structured receipt draft.

    OCR extraction and receipt interpretation intentionally remain
    separate so that OCR providers can be changed independently and
    parsed values can always be reviewed before they are saved.
    """

    CURRENCY_PATTERN = re.compile(
        r"(?:php|₱)\s*(-?\s*[\d,]+(?:\.\d{1,2})?)",
        re.IGNORECASE,
    )

    PLAIN_AMOUNT_PATTERN = re.compile(
        r"^-?\s*[\d,]+\.\d{1,3}$"
    )

    DATE_PATTERN = re.compile(
        r"\b(\d{1,2}/\d{1,2}/\d{4})\b"
    )

    TIME_PATTERN = re.compile(
        r"\b(\d{1,2}:\d{2}:\d{2})\b"
    )

    REFERENCE_PATTERNS = (
        re.compile(
            r"\bS\.?\s*I\.?\s*#?\s*[:.]?\s*([A-Z0-9-]+)",
            re.IGNORECASE,
        ),
        re.compile(
            r"\bINVOICE\s*(?:NO\.?|NUMBER|#)?\s*[:.]?\s*([A-Z0-9-]+)",
            re.IGNORECASE,
        ),
        re.compile(
            r"\bRECEIPT\s*(?:NO\.?|NUMBER|#)\s*[:.]?\s*([A-Z0-9-]+)",
            re.IGNORECASE,
        ),
    )

    TOTAL_LABELS = (
        "total (incl. vat)",
        "total (inel. vat)",
        "grand total",
        "amount due",
        "net total",
        "total",
    )

    SUBTOTAL_LABELS = (
        "vatable sales",
        "subtotal",
        "sub total",
    )

    TAX_LABELS = (
        "vat amount",
        "tax amount",
        "sales tax",
        "tax",
    )

    DISCOUNT_LABELS = (
        "discount amount",
        "discount",
    )

    CASH_TENDERED_LABELS = (
        "cash tendered",
        "cash received",
        "amount tendered",
        "tendered",
    )

    CHANGE_LABELS = (
        "change",
    )

    ITEM_DESCRIPTION_HEADERS = (
        "description",
        "item",
        "items",
        "product",
        "products",
        "particular",
        "particulars",
    )

    ITEM_HEADER_WORDS = {
        "description",
        "item",
        "items",
        "product",
        "products",
        "particular",
        "particulars",
        "qty",
        "qty.",
        "quantity",
        "price",
        "unit price",
        "unitprice",
        "amount",
        "total",
    }

    METADATA_PREFIXES = (
        "dealer:",
        "dealer.",
        "vat reg tin:",
        "pos s/n:",
        "date:",
        "time:",
        "name:",
        "tin:",
        "address:",
        "business style:",
        "businass style:",
        "cashier:",
        "accred.",
        "acored.",
        "aoored.",
        "p.t.u.",
        "date issued:",
        "date imsued:",
    )

    ITEM_MARKER_PATTERNS = (
        re.compile(
            r"^\(\s*v\s*\)$",
            re.IGNORECASE,
        ),
        re.compile(
            r"^\(\s*p\s*[:.]?.*\)$",
            re.IGNORECASE,
        ),
    )

    def parse(
        self,
        ocr_result: dict[str, Any],
    ) -> ParsedReceipt:
        raw_lines = ocr_result.get(
            "lines",
            [],
        )

        lines = self._normalize_lines(
            raw_lines
        )

        parsed = ParsedReceipt()

        parsed.merchant = (
            self._extract_merchant(lines)
        )

        parsed.receipt_date = (
            self._extract_date(lines)
        )

        parsed.receipt_time = (
            self._extract_time(lines)
        )

        parsed.reference_number = (
            self._extract_reference_number(
                lines
            )
        )

        parsed.items = (
            self._extract_items(lines)
        )

        parsed.subtotal = (
            self._extract_labeled_amount(
                lines,
                self.SUBTOTAL_LABELS,
            )
        )

        parsed.tax = (
            self._extract_labeled_amount(
                lines,
                self.TAX_LABELS,
            )
        )

        parsed.discount = (
            self._extract_labeled_amount(
                lines,
                self.DISCOUNT_LABELS,
            )
        )

        parsed.total = (
            self._extract_labeled_amount(
                lines,
                self.TOTAL_LABELS,
            )
        )

        parsed.amount_tendered = (
            self._extract_labeled_amount(
                lines,
                self.CASH_TENDERED_LABELS,
            )
        )

        parsed.change = (
            self._extract_labeled_amount(
                lines,
                self.CHANGE_LABELS,
            )
        )

        parsed.payment_method = (
            self._extract_payment_method(
                lines
            )
        )

        parsed.warnings = (
            self._build_warnings(parsed)
        )

        parsed.parser_confidence = (
            self._calculate_confidence(
                parsed
            )
        )

        return parsed

    @staticmethod
    def _normalize_lines(
        raw_lines: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        normalized: list[
            dict[str, Any]
        ] = []

        for index, raw_line in enumerate(
            raw_lines
        ):
            text = str(
                raw_line.get(
                    "text",
                    "",
                )
            ).strip()

            if not text:
                continue

            confidence = raw_line.get(
                "confidence",
                0.0,
            )

            try:
                confidence_value = float(
                    confidence
                )
            except (
                TypeError,
                ValueError,
            ):
                confidence_value = 0.0

            normalized.append(
                {
                    "index": index,
                    "text": text,
                    "lower": text.lower(),
                    "confidence": confidence_value,
                    "box": raw_line.get("box"),
                }
            )

        return normalized

    def _extract_merchant(
        self,
        lines: list[dict[str, Any]],
    ) -> str | None:
        if not lines:
            return None

        candidates: list[str] = []

        for line in lines[:8]:
            text = line["text"]
            lower = line["lower"]

            if self._is_metadata_line(
                lower
            ):
                continue

            if (
                "sales invoice" in lower
                or "official receipt" in lower
            ):
                break

            if self._contains_amount(text):
                continue

            candidates.append(text)

            if len(candidates) == 2:
                break

        if not candidates:
            return None

        if len(candidates) == 1:
            return candidates[0]

        first = candidates[0]
        second = candidates[1]

        if (
            len(first) <= 30
            and len(second) <= 50
        ):
            return f"{first} - {second}"

        return first

    def _extract_date(
        self,
        lines: list[dict[str, Any]],
    ):
        for line in lines:
            if not line[
                "lower"
            ].startswith("date:"):
                continue

            match = self.DATE_PATTERN.search(
                line["text"]
            )

            if match is None:
                continue

            parsed_date = (
                self._parse_date_value(
                    match.group(1)
                )
            )

            if parsed_date is not None:
                return parsed_date

        for line in lines:
            match = self.DATE_PATTERN.search(
                line["text"]
            )

            if match is None:
                continue

            parsed_date = (
                self._parse_date_value(
                    match.group(1)
                )
            )

            if parsed_date is not None:
                return parsed_date

        return None

    @staticmethod
    def _parse_date_value(
        value: str,
    ):
        formats = (
            "%m/%d/%Y",
            "%d/%m/%Y",
        )

        for date_format in formats:
            try:
                return datetime.strptime(
                    value,
                    date_format,
                ).date()
            except ValueError:
                continue

        return None

    def _extract_time(
        self,
        lines: list[dict[str, Any]],
    ):
        for line in lines:
            if not line[
                "lower"
            ].startswith("time:"):
                continue

            match = self.TIME_PATTERN.search(
                line["text"]
            )

            if match is None:
                continue

            try:
                return datetime.strptime(
                    match.group(1),
                    "%H:%M:%S",
                ).time()
            except ValueError:
                continue

        return None

    def _extract_reference_number(
        self,
        lines: list[dict[str, Any]],
    ) -> str | None:
        for line in lines:
            for pattern in (
                self.REFERENCE_PATTERNS
            ):
                match = pattern.search(
                    line["text"]
                )

                if match is not None:
                    return match.group(
                        1
                    ).strip()

        return None

    def _extract_items(
        self,
        lines: list[dict[str, Any]],
    ) -> list[ParsedReceiptItem]:
        items: list[
            ParsedReceiptItem
        ] = []

        start_index = (
            self._find_item_header_end(
                lines
            )
        )

        if start_index is None:
            start_index = (
                self._find_probable_item_start(
                    lines
                )
            )

        if start_index is None:
            return items

        summary_index = (
            self._find_summary_start(
                lines,
                start_index,
            )
        )

        if summary_index is None:
            summary_index = len(lines)

        item_lines = lines[
            start_index:summary_index
        ]

        position = 0

        while position < len(
            item_lines
        ):
            line = item_lines[position]

            if not self._is_item_name(
                line["text"]
            ):
                position += 1
                continue

            item_name = (
                self._clean_item_name(
                    line["text"]
                )
            )

            numeric_values: list[
                Decimal
            ] = []

            next_item_position: int | None = None

            lookahead_end = min(
                position + 9,
                len(item_lines),
            )

            for candidate_position in range(
                position + 1,
                lookahead_end,
            ):
                candidate = item_lines[
                    candidate_position
                ]

                candidate_text = (
                    candidate["text"]
                )

                if self._is_item_marker(
                    candidate_text
                ):
                    continue

                number = (
                    self._parse_numeric_value(
                        candidate_text
                    )
                )

                if number is not None:
                    numeric_values.append(
                        number
                    )

                    if len(
                        numeric_values
                    ) >= 3:
                        break

                    continue

                if self._is_item_name(
                    candidate_text
                ):
                    next_item_position = (
                        candidate_position
                    )
                    break

            quantity: Decimal | None = None
            unit_price: Decimal | None = None
            amount: Decimal | None = None

            if len(numeric_values) >= 3:
                quantity = numeric_values[0]
                unit_price = numeric_values[1]
                amount = numeric_values[2]

            elif len(numeric_values) == 2:
                quantity = Decimal("1")
                unit_price = numeric_values[0]
                amount = numeric_values[1]

            elif len(numeric_values) == 1:
                quantity = Decimal("1")
                amount = numeric_values[0]

            if (
                item_name
                and amount is not None
            ):
                items.append(
                    ParsedReceiptItem(
                        name=item_name,
                        quantity=quantity
                        or Decimal("1"),
                        unit_price=unit_price,
                        amount=amount,
                    )
                )

            if (
                next_item_position
                is not None
            ):
                position = (
                    next_item_position
                )
            else:
                position += 1

        return items

    def _find_item_header_end(
        self,
        lines: list[dict[str, Any]],
    ) -> int | None:
        for index, line in enumerate(
            lines
        ):
            if not self._is_description_header(
                line["lower"]
            ):
                continue

            next_index = index + 1

            while next_index < len(lines):
                next_text = lines[
                    next_index
                ]["lower"]

                if self._is_item_header_word(
                    next_text
                ):
                    next_index += 1
                    continue

                break

            return next_index

        return None

    def _find_probable_item_start(
        self,
        lines: list[dict[str, Any]],
    ) -> int | None:
        """
        Fallback for receipts where OCR badly damages the table
        heading or omits it completely.

        Search for a plausible item name followed shortly by either:
        - quantity + unit price + amount
        - unit price + amount

        This keeps item extraction from depending entirely on a
        correctly recognized 'Description' heading.
        """

        search_limit = len(lines)

        for index, line in enumerate(
            lines
        ):
            if not self._is_item_name(
                line["text"]
            ):
                continue

            numeric_values: list[
                Decimal
            ] = []

            for next_index in range(
                index + 1,
                min(
                    index + 9,
                    search_limit,
                ),
            ):
                candidate_text = lines[
                    next_index
                ]["text"]

                if self._is_item_marker(
                    candidate_text
                ):
                    continue

                value = (
                    self._parse_numeric_value(
                        candidate_text
                    )
                )

                if value is not None:
                    numeric_values.append(
                        value
                    )

                    if len(
                        numeric_values
                    ) >= 2:
                        return index

                    continue

                if self._is_item_name(
                    candidate_text
                ):
                    break

        return None

    def _is_description_header(
        self,
        text: str,
    ) -> bool:
        normalized = (
            self._normalize_header_text(
                text
            )
        )

        if not normalized:
            return False

        for expected in (
            self.ITEM_DESCRIPTION_HEADERS
        ):
            expected_normalized = (
                self._normalize_header_text(
                    expected
                )
            )

            if (
                normalized
                == expected_normalized
            ):
                return True

            if (
                len(normalized) >= 5
                and len(
                    expected_normalized
                ) >= 5
            ):
                similarity = (
                    SequenceMatcher(
                        None,
                        normalized,
                        expected_normalized,
                    ).ratio()
                )

                if similarity >= 0.72:
                    return True

        return False

    def _is_item_header_word(
        self,
        text: str,
    ) -> bool:
        normalized = (
            self._normalize_header_text(
                text
            )
        )

        if not normalized:
            return False

        if self._is_description_header(
            normalized
        ):
            return True

        for header in (
            self.ITEM_HEADER_WORDS
        ):
            header_normalized = (
                self._normalize_header_text(
                    header
                )
            )

            if (
                normalized
                == header_normalized
            ):
                return True

        return False

    @staticmethod
    def _normalize_header_text(
        text: str,
    ) -> str:
        return re.sub(
            r"[^a-z0-9]+",
            "",
            text.lower(),
        )

    def _find_summary_start(
        self,
        lines: list[dict[str, Any]],
        start_index: int,
    ) -> int | None:
        summary_labels = (
            self.TOTAL_LABELS
            + self.SUBTOTAL_LABELS
            + self.DISCOUNT_LABELS
        )

        for index in range(
            start_index,
            len(lines),
        ):
            if self._matches_label(
                lines[index]["lower"],
                summary_labels,
            ):
                return index

        return None

    def _extract_labeled_amount(
        self,
        lines: list[dict[str, Any]],
        labels: tuple[str, ...],
    ) -> Decimal | None:
        for index, line in enumerate(
            lines
        ):
            if not self._matches_label(
                line["lower"],
                labels,
            ):
                continue

            same_line_amount = (
                self._extract_currency_amount(
                    line["text"]
                )
            )

            if same_line_amount is not None:
                return abs(
                    same_line_amount
                )

            for offset in range(1, 3):
                next_index = (
                    index + offset
                )

                if next_index >= len(
                    lines
                ):
                    break

                amount = (
                    self._extract_currency_amount(
                        lines[
                            next_index
                        ]["text"]
                    )
                )

                if amount is not None:
                    return abs(amount)

        return None

    def _extract_payment_method(
        self,
        lines: list[dict[str, Any]],
    ) -> str | None:
        for line in lines:
            lower = line["lower"]

            if "cash tendered" in lower:
                return "cash"

            if (
                "credit card" in lower
                or "visa" in lower
                or "mastercard" in lower
            ):
                return "card"

            if "gcash" in lower:
                return "gcash"

            if "maya" in lower:
                return "maya"

        return None

    @staticmethod
    def _matches_label(
        text: str,
        labels: tuple[str, ...],
    ) -> bool:
        normalized = text.strip().lower()

        for label in labels:
            normalized_label = (
                label.strip().lower()
            )

            if (
                normalized
                == normalized_label
                or normalized.startswith(
                    f"{normalized_label}:"
                )
            ):
                return True

            if (
                normalized_label
                in {
                    "total",
                    "subtotal",
                    "sub total",
                    "discount",
                    "tax",
                    "change",
                }
                and normalized.startswith(
                    f"{normalized_label} "
                )
            ):
                return True

        return False

    def _is_item_name(
        self,
        text: str,
    ) -> bool:
        stripped = text.strip()

        if not stripped:
            return False

        lower = stripped.lower()

        if self._is_item_header_word(
            lower
        ):
            return False

        if self._is_metadata_line(
            lower
        ):
            return False

        if self._matches_label(
            lower,
            (
                self.TOTAL_LABELS
                + self.SUBTOTAL_LABELS
                + self.TAX_LABELS
                + self.DISCOUNT_LABELS
                + self.CASH_TENDERED_LABELS
                + self.CHANGE_LABELS
            ),
        ):
            return False

        if self._parse_numeric_value(
            stripped
        ) is not None:
            return False

        if self._is_item_marker(
            stripped
        ):
            return False

        return True

    def _is_item_marker(
        self,
        text: str,
    ) -> bool:
        stripped = text.strip()

        for pattern in (
            self.ITEM_MARKER_PATTERNS
        ):
            if pattern.fullmatch(
                stripped
            ):
                return True

        if re.fullmatch(
            r"\([^)]*\)",
            stripped,
        ):
            return True

        return False

    @staticmethod
    def _clean_item_name(
        text: str,
    ) -> str:
        return text.strip().lstrip(
            "*"
        ).strip()

    def _is_metadata_line(
        self,
        lower: str,
    ) -> bool:
        return lower.startswith(
            self.METADATA_PREFIXES
        )

    def _contains_amount(
        self,
        text: str,
    ) -> bool:
        return (
            self._extract_currency_amount(
                text
            )
            is not None
        )

    def _extract_currency_amount(
        self,
        text: str,
    ) -> Decimal | None:
        match = self.CURRENCY_PATTERN.search(
            text
        )

        if match is None:
            return None

        return self._decimal_from_text(
            match.group(1)
        )

    def _parse_numeric_value(
        self,
        text: str,
    ) -> Decimal | None:
        stripped = text.strip()

        currency_value = (
            self._extract_currency_amount(
                stripped
            )
        )

        if currency_value is not None:
            return currency_value

        if not self.PLAIN_AMOUNT_PATTERN.fullmatch(
            stripped
        ):
            return None

        return self._decimal_from_text(
            stripped
        )

    @staticmethod
    def _decimal_from_text(
        value: str,
    ) -> Decimal | None:
        cleaned = (
            value.replace(",", "")
            .replace(" ", "")
            .strip()
        )

        try:
            return Decimal(cleaned)
        except InvalidOperation:
            return None

    @staticmethod
    def _build_warnings(
        parsed: ParsedReceipt,
    ) -> list[str]:
        warnings: list[str] = []

        if parsed.merchant is None:
            warnings.append(
                "Merchant could not be detected."
            )

        if parsed.receipt_date is None:
            warnings.append(
                "Receipt date could not be detected."
            )

        if parsed.total is None:
            warnings.append(
                "Receipt total could not be detected."
            )

        if not parsed.items:
            warnings.append(
                "No receipt items could be detected."
            )

        if (
            parsed.total is not None
            and parsed.items
        ):
            item_total = sum(
                (
                    item.amount
                    for item in parsed.items
                ),
                Decimal("0"),
            )

            difference = abs(
                item_total
                - parsed.total
            )

            if difference > Decimal(
                "0.05"
            ):
                warnings.append(
                    "Detected item amounts do not match the receipt total."
                )

        return warnings

    @staticmethod
    def _calculate_confidence(
        parsed: ParsedReceipt,
    ) -> float:
        score = 0.0

        if parsed.merchant:
            score += 0.20

        if parsed.receipt_date:
            score += 0.15

        if parsed.reference_number:
            score += 0.10

        if parsed.items:
            score += 0.25

        if parsed.total is not None:
            score += 0.20

        if parsed.payment_method:
            score += 0.05

        if (
            parsed.tax is not None
            or parsed.subtotal is not None
        ):
            score += 0.05

        return min(
            score,
            1.0,
        )


receipt_parser = ReceiptParser()