import {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    deleteAuthTokens,
    getAuthTokens,
    saveAuthTokens,
    StoredAuthTokens,
} from "@/services/authStorage";
import {
    subscribeToSessionExpired,
} from "@/services/authSession";


type AuthContextValue = {
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signIn: (tokens: StoredAuthTokens) => Promise<void>;
    signOut: () => Promise<void>;
};


const AuthContext = createContext<AuthContextValue | undefined>(
    undefined,
);


export function AuthProvider({
    children,
}: PropsWithChildren) {
    const [
        accessToken,
        setAccessToken,
    ] = useState<string | null>(null);

    const [
        refreshToken,
        setRefreshToken,
    ] = useState<string | null>(null);

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);


    const clearSessionState = useCallback(() => {
        setAccessToken(null);
        setRefreshToken(null);
    }, []);


    useEffect(() => {
        let isMounted = true;

        const restoreSession = async () => {
            try {
                const tokens = await getAuthTokens();

                if (!isMounted) {
                    return;
                }

                if (!tokens) {
                    clearSessionState();

                    return;
                }

                setAccessToken(tokens.accessToken);
                setRefreshToken(tokens.refreshToken);
            } catch {
                if (!isMounted) {
                    return;
                }

                clearSessionState();

                try {
                    await deleteAuthTokens();
                } catch {
                    // Ignore cleanup errors during session restoration.
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void restoreSession();

        return () => {
            isMounted = false;
        };
    }, [
        clearSessionState,
    ]);


    useEffect(() => {
        const unsubscribe =
            subscribeToSessionExpired(
                clearSessionState,
            );

        return unsubscribe;
    }, [
        clearSessionState,
    ]);


    const signIn = useCallback(
        async (tokens: StoredAuthTokens) => {
            await saveAuthTokens(tokens);

            setAccessToken(tokens.accessToken);
            setRefreshToken(tokens.refreshToken);
        },
        [],
    );


    const signOut = useCallback(async () => {
        await deleteAuthTokens();

        clearSessionState();
    }, [
        clearSessionState,
    ]);


    const value = useMemo<AuthContextValue>(
        () => ({
            accessToken,
            refreshToken,
            isAuthenticated:
                Boolean(accessToken && refreshToken),
            isLoading,
            signIn,
            signOut,
        }),
        [
            accessToken,
            refreshToken,
            isLoading,
            signIn,
            signOut,
        ],
    );


    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used within an AuthProvider.",
        );
    }

    return context;
}