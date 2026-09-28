const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
    throw new Error(
        "Missing EXPO_PUBLIC_API_URL. Add it to mobile/.env.",
    );
}

export const config = {
    apiUrl: apiUrl.replace(/\/+$/, ""),
} as const;