import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "gastify_access_token";
const REFRESH_TOKEN_KEY = "gastify_refresh_token";


export type StoredAuthTokens = {
    accessToken: string;
    refreshToken: string;
};


export async function saveAuthTokens(
    tokens: StoredAuthTokens,
): Promise<void> {
    await Promise.all([
        SecureStore.setItemAsync(
            ACCESS_TOKEN_KEY,
            tokens.accessToken,
        ),
        SecureStore.setItemAsync(
            REFRESH_TOKEN_KEY,
            tokens.refreshToken,
        ),
    ]);
}


export async function saveAccessToken(
    accessToken: string,
): Promise<void> {
    await SecureStore.setItemAsync(
        ACCESS_TOKEN_KEY,
        accessToken,
    );
}


export async function getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(
        ACCESS_TOKEN_KEY,
    );
}


export async function getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(
        REFRESH_TOKEN_KEY,
    );
}


export async function getAuthTokens(): Promise<StoredAuthTokens | null> {
    const [
        accessToken,
        refreshToken,
    ] = await Promise.all([
        getAccessToken(),
        getRefreshToken(),
    ]);

    if (!accessToken || !refreshToken) {
        return null;
    }

    return {
        accessToken,
        refreshToken,
    };
}


export async function deleteAuthTokens(): Promise<void> {
    await Promise.all([
        SecureStore.deleteItemAsync(
            ACCESS_TOKEN_KEY,
        ),
        SecureStore.deleteItemAsync(
            REFRESH_TOKEN_KEY,
        ),
    ]);
}