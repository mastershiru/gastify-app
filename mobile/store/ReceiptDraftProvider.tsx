import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

import type {
    ReceiptParseResponse,
} from "@/types/receipt";


type ReceiptDraftContextValue = {
    draft: ReceiptParseResponse | null;

    setDraft: (
        draft: ReceiptParseResponse,
    ) => void;

    clearDraft: () => void;
};


const ReceiptDraftContext =
    createContext<
        ReceiptDraftContextValue | undefined
    >(undefined);


type ReceiptDraftProviderProps = {
    children: ReactNode;
};


export function ReceiptDraftProvider({
    children,
}: ReceiptDraftProviderProps) {
    const [
        draft,
        setDraftState,
    ] = useState<
        ReceiptParseResponse | null
    >(null);


    const setDraft = useCallback(
        (
            nextDraft: ReceiptParseResponse,
        ) => {
            setDraftState(nextDraft);
        },
        [],
    );


    const clearDraft = useCallback(
        () => {
            setDraftState(null);
        },
        [],
    );


    const value = useMemo(
        () => ({
            draft,
            setDraft,
            clearDraft,
        }),
        [
            clearDraft,
            draft,
            setDraft,
        ],
    );


    return (
        <ReceiptDraftContext.Provider
            value={value}
        >
            {children}
        </ReceiptDraftContext.Provider>
    );
}


export function useReceiptDraft() {
    const context = useContext(
        ReceiptDraftContext,
    );

    if (!context) {
        throw new Error(
            "useReceiptDraft must be used inside ReceiptDraftProvider.",
        );
    }

    return context;
}