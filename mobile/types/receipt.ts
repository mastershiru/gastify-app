export type ParsedReceiptItem = {
    name: string;
    quantity: string;
    unit_price: string | null;
    amount: string;
};

export type ParsedReceipt = {
    merchant: string | null;
    receipt_date: string | null;
    receipt_time: string | null;
    reference_number: string | null;

    items: ParsedReceiptItem[];

    subtotal: string | null;
    tax: string | null;
    discount: string | null;
    total: string | null;

    payment_method: string | null;
    amount_tendered: string | null;
    change: string | null;

    parser_confidence: number;
    warnings: string[];
};

export type ReceiptParseResponse = {
    draft_id: string;
    original_filename: string;
    parsed: ParsedReceipt;
};

export type ReceiptImageUpload = {
    uri: string;
    fileName: string | null;
    mimeType: string | null;
};

export type ReceiptConfirmItem = {
    name: string;
    quantity: string;
    unit_price: string;
};

export type ReceiptConfirmPayload = {
    draft_id: string;
    merchant: string | null;
    receipt_date: string;
    items: ReceiptConfirmItem[];
    total: string;
    category: string | null;
    note: string | null;
};

export type ReceiptConfirmedItem = {
    id: number;
    name: string;
    quantity: string;
    unit_price: string;
};

export type ReceiptConfirmResponse = {
    receipt_id: number;
    expense_id: number;
    merchant: string | null;
    receipt_date: string;
    total: string;
    category: string | null;
    note: string | null;
    items: ReceiptConfirmedItem[];
    status: string;
};

export type ReceiptListItem = {
    id: number;
    merchant: string | null;
    receipt_date: string;
    total: string | null;
    category: string | null;
    status: string;
    created_at: string;
};

export type ReceiptListResponse = {
    receipts: ReceiptListItem[];
};

export type ReceiptDetailItem = {
    id: number;
    name: string;
    quantity: string;
    unit_price: string;
};

export type ReceiptOCRInfo = {
    receipt_time: string | null;
    reference_number: string | null;
    subtotal: string | null;
    tax: string | null;
    discount: string | null;
    payment_method: string | null;
    amount_tendered: string | null;
    change: string | null;
    parser_confidence: number | null;
    warnings: string[];
};

export type ReceiptDetailResponse = {
    id: number;
    merchant: string | null;
    receipt_date: string;
    status: string;
    image_url: string;
    total: string | null;
    category: string | null;
    note: string | null;
    items: ReceiptDetailItem[];
    ocr: ReceiptOCRInfo | null;
    created_at: string;
    updated_at: string;
};