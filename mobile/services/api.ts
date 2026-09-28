import {
    deleteAuthTokens,
    getAccessToken,
    getRefreshToken,
    saveAccessToken,
} from "./authStorage";
import {
    notifySessionExpired,
} from "./authSession";
import { config } from "./config";


export type ApiUser = {
    id: number;
    email: string;
    username: string | null;
    created_at: string;
    updated_at: string;
};


export type RegisterPayload = {
    email: string;
    username?: string;
    password: string;
};


export type RegisterResponse = {
    message: string;
    user: ApiUser;
};


export type LoginPayload = {
    email: string;
    password: string;
};


export type LoginResponse = {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: ApiUser;
};


export type RefreshResponse = {
    access_token: string;
    token_type: string;
};


type ValidationErrorItem = {
    loc?: Array<string | number>;
    msg?: string;
    type?: string;
};


type ApiErrorBody = {
    detail?: string | ValidationErrorItem[];
};


export class ApiError extends Error {
    status: number;
    data?: ApiErrorBody;

    constructor(
        message: string,
        status: number,
        data?: ApiErrorBody,
    ) {
        super(message);

        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}


async function parseErrorResponse(
    response: Response,
): Promise<ApiError> {
    let data: ApiErrorBody | undefined;

    try {
        data = (await response.json()) as ApiErrorBody;
    } catch {
        data = undefined;
    }

    let message =
        `Request failed with status ${response.status}.`;

    if (typeof data?.detail === "string") {
        message = data.detail;
    } else if (
        Array.isArray(data?.detail) &&
        data.detail.length > 0
    ) {
        message =
            data.detail[0]?.msg ??
            "Please check the information you entered.";
    }

    return new ApiError(
        message,
        response.status,
        data,
    );
}


function buildUrl(path: string): string {
    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }

    const normalizedPath =
        path.startsWith("/")
            ? path
            : `/${path}`;

    return `${config.apiUrl}${normalizedPath}`;
}


function buildHeaders(
    headers?: HeadersInit,
    accessToken?: string | null,
): Headers {
    const result = new Headers(headers);

    if (accessToken) {
        result.set(
            "Authorization",
            `Bearer ${accessToken}`,
        );
    }

    return result;
}


async function expireSession(): Promise<void> {
    try {
        await deleteAuthTokens();
    } finally {
        notifySessionExpired();
    }
}


async function requestNewAccessToken(): Promise<string | null> {
    const refreshToken =
        await getRefreshToken();

    if (!refreshToken) {
        await expireSession();

        return null;
    }

    const response = await fetch(
        `${config.apiUrl}/api/v1/auth/refresh`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refresh_token: refreshToken,
            }),
        },
    );

    if (!response.ok) {
        await expireSession();

        return null;
    }

    const data =
        (await response.json()) as RefreshResponse;

    if (!data.access_token) {
        await expireSession();

        return null;
    }

    await saveAccessToken(
        data.access_token,
    );

    return data.access_token;
}


export async function authenticatedFetch(
    path: string,
    init: RequestInit = {},
): Promise<Response> {
    const accessToken =
        await getAccessToken();

    if (!accessToken) {
        await expireSession();

        throw new ApiError(
            "Authentication is required.",
            401,
        );
    }

    const firstResponse = await fetch(
        buildUrl(path),
        {
            ...init,
            headers: buildHeaders(
                init.headers,
                accessToken,
            ),
        },
    );

    if (firstResponse.status !== 401) {
        return firstResponse;
    }

    const newAccessToken =
        await requestNewAccessToken();

    if (!newAccessToken) {
        throw new ApiError(
            "Your session has expired. Please sign in again.",
            401,
        );
    }

    const retryResponse = await fetch(
        buildUrl(path),
        {
            ...init,
            headers: buildHeaders(
                init.headers,
                newAccessToken,
            ),
        },
    );

    if (retryResponse.status === 401) {
        await expireSession();

        throw new ApiError(
            "Your session has expired. Please sign in again.",
            401,
        );
    }

    return retryResponse;
}


export async function getHealthStatus() {
    const response = await fetch(
        `${config.apiUrl}/health`,
    );

    if (!response.ok) {
        throw await parseErrorResponse(
            response,
        );
    }

    return response.json();
}


export async function registerUser(
    payload: RegisterPayload,
): Promise<RegisterResponse> {
    const response = await fetch(
        `${config.apiUrl}/api/v1/auth/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        },
    );

    if (!response.ok) {
        throw await parseErrorResponse(
            response,
        );
    }

    return (
        await response.json()
    ) as RegisterResponse;
}


export async function loginUser(
    payload: LoginPayload,
): Promise<LoginResponse> {
    const response = await fetch(
        `${config.apiUrl}/api/v1/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        },
    );

    if (!response.ok) {
        throw await parseErrorResponse(
            response,
        );
    }

    return (
        await response.json()
    ) as LoginResponse;
}