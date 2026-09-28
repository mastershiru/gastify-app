import {
    ApiError,
    authenticatedFetch,
} from "./api";


export type ManualExpensePayload = {
    amount: string;
    date: string;
    category: string | null;
    note: string | null;
};


export type ExpenseResponse = {
    id: number;
    amount: string;
    date: string;
    category: string | null;
    note: string | null;
    source: "manual" | "receipt";
    created_at: string;
    updated_at: string;
};


export type ExpenseListResponse = {
    expenses: ExpenseResponse[];
    page: number;
    page_size: number;
};


export const expenseApi = {
    async getExpenses(pageSize = 50): Promise<ExpenseListResponse> {
        const response = await authenticatedFetch(
            `/api/v1/expenses?page_size=${pageSize}`,
        );

        if (!response.ok) {
            throw new ApiError(
                "Unable to load expenses.",
                response.status,
            );
        }

        return await response.json() as ExpenseListResponse;
    },

    async createManualExpense(
        payload: ManualExpensePayload,
    ): Promise<ExpenseResponse> {
        const response = await authenticatedFetch(
            "/api/v1/expenses/manual",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            },
        );

        if (!response.ok) {
            let detail = "Unable to save the expense.";

            try {
                const body = await response.json() as {
                    detail?: string;
                };

                detail = body.detail ?? detail;
            } catch {
                // Use the default message.
            }

            throw new ApiError(
                detail,
                response.status,
            );
        }

        return await response.json() as ExpenseResponse;
    },
};
