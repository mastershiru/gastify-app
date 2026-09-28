import {
    ImageManipulator,
    SaveFormat,
} from "expo-image-manipulator";

import {
    ApiError,
    authenticatedFetch,
} from "./api";

import type {
    ReceiptConfirmPayload,
    ReceiptConfirmResponse,
    ReceiptDetailResponse,
    ReceiptImageUpload,
    ReceiptListResponse,
    ReceiptParseResponse,
} from "@/types/receipt";


type ValidationErrorItem = {
    loc?: Array<string | number>;
    msg?: string;
    type?: string;
};


type ApiErrorBody = {
    detail?:
    | string
    | ValidationErrorItem[];
};


async function normalizeReceiptImage(
    image: ReceiptImageUpload,
): Promise<{
    uri: string;
    fileName: string;
    mimeType: "image/jpeg";
}> {
    const context =
        ImageManipulator.manipulate(
            image.uri,
        );

    const renderedImage =
        await context.renderAsync();

    const result =
        await renderedImage.saveAsync({
            format: SaveFormat.JPEG,
            compress: 0.9,
        });

    return {
        uri: result.uri,
        fileName: "receipt.jpg",
        mimeType: "image/jpeg",
    };
}


async function parseApiError(
    response: Response,
): Promise<ApiError> {
    let data:
        | ApiErrorBody
        | undefined;

    try {
        data =
            (await response.json()) as ApiErrorBody;
    } catch {
        data = undefined;
    }

    let message =
        `Request failed with status ${response.status}.`;

    if (
        typeof data?.detail === "string"
    ) {
        message = data.detail;
    } else if (
        Array.isArray(
            data?.detail,
        ) &&
        data.detail.length > 0
    ) {
        message =
            data.detail[0]?.msg ??
            "The receipt request could not be completed.";
    }

    return new ApiError(
        message,
        response.status,
        data,
    );
}


export const receiptApi = {
    async parseReceipt(
        image: ReceiptImageUpload,
    ): Promise<ReceiptParseResponse> {
        const normalizedImage =
            await normalizeReceiptImage(
                image,
            );

        const formData =
            new FormData();

        formData.append(
            "file",
            {
                uri:
                    normalizedImage.uri,

                name:
                    normalizedImage.fileName,

                type:
                    normalizedImage.mimeType,
            } as unknown as Blob,
        );

        const response =
            await authenticatedFetch(
                "/api/v1/receipts/parse",
                {
                    method: "POST",
                    body: formData,
                },
            );

        if (!response.ok) {
            throw await parseApiError(
                response,
            );
        }

        return (
            await response.json()
        ) as ReceiptParseResponse;
    },


    async confirmReceipt(
        payload: ReceiptConfirmPayload,
    ): Promise<ReceiptConfirmResponse> {
        const response =
            await authenticatedFetch(
                "/api/v1/receipts/confirm",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(
                        payload,
                    ),
                },
            );

        if (!response.ok) {
            throw await parseApiError(
                response,
            );
        }

        return (
            await response.json()
        ) as ReceiptConfirmResponse;
    },


    async getReceipts():
        Promise<ReceiptListResponse> {
        const response =
            await authenticatedFetch(
                "/api/v1/receipts",
                {
                    method: "GET",
                },
            );

        if (!response.ok) {
            throw await parseApiError(
                response,
            );
        }

        return (
            await response.json()
        ) as ReceiptListResponse;
    },


    async getReceipt(
        receiptId: number,
    ): Promise<ReceiptDetailResponse> {
        const response =
            await authenticatedFetch(
                `/api/v1/receipts/${receiptId}`,
                {
                    method: "GET",
                },
            );

        if (!response.ok) {
            throw await parseApiError(
                response,
            );
        }

        return (
            await response.json()
        ) as ReceiptDetailResponse;
    },


    async deleteReceipt(
        receiptId: number,
    ): Promise<void> {
        const response = await authenticatedFetch(
            `/api/v1/receipts/${receiptId}`,
            {
                method: "DELETE",
            },
        );

        if (!response.ok) {
            throw await parseApiError(response);
        }
    },
};
