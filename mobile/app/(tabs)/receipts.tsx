import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";

import { GlassCard } from "@/components/ui";
import { GASTIFY_THEMES, type GastifyColorScheme } from "@/constants/theme";
import { ApiError } from "@/services/api";
import { receiptApi } from "@/services/receiptApi";
import type { ReceiptListItem } from "@/types/receipt";

function formatMoney(value: string | null) {
    const amount = Number(value);
    return value && Number.isFinite(amount) ? `PHP ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
}

function formatDate(value: string) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export default function ReceiptsScreen() {
    const scheme: GastifyColorScheme = useColorScheme() === "dark" ? "dark" : "light";
    const theme = GASTIFY_THEMES[scheme];
    const insets = useSafeAreaInsets();
    const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deletingReceiptId, setDeletingReceiptId] = useState<number | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedReceiptIds, setSelectedReceiptIds] = useState<number[]>([]);
    const swipeableRows = useRef<Map<number, { close: () => void }>>(new Map());

    const closeSwipeableRows = useCallback((exceptId?: number) => {
        swipeableRows.current.forEach((row, receiptId) => {
            if (receiptId !== exceptId) {
                row.close();
            }
        });
    }, []);

    const loadReceipts = useCallback(async (refresh = false) => {
        if (refresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        try {
            setReceipts((await receiptApi.getReceipts()).receipts);
            closeSwipeableRows();
        } catch (error) {
            Alert.alert("Receipt history unavailable", error instanceof ApiError ? error.message : "Unable to load receipt history.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [closeSwipeableRows]);

    useEffect(() => { void loadReceipts(); }, [loadReceipts]);


    const deleteReceipt = useCallback(async (receipt: ReceiptListItem) => {
        setDeletingReceiptId(receipt.id);
        try {
            await receiptApi.deleteReceipt(receipt.id);
            setReceipts((current) => current.filter((item) => item.id !== receipt.id));
        } catch (error) {
            Alert.alert("Unable to delete receipt", error instanceof ApiError ? error.message : "Please try again.");
        } finally {
            setDeletingReceiptId(null);
        }
    }, []);

    const confirmDeleteReceipt = useCallback((receipt: ReceiptListItem) => {
        Alert.alert(
            "Delete receipt?",
            `Delete ${receipt.merchant ?? "this receipt"} and its linked expense? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => void deleteReceipt(receipt),
                },
            ],
        );
    }, [deleteReceipt]);

    const toggleReceiptSelection = useCallback((receiptId: number) => {
        setSelectedReceiptIds((current) => current.includes(receiptId)
            ? current.filter((id) => id !== receiptId)
            : [...current, receiptId]);
    }, []);

    const exitSelectionMode = useCallback(() => {
        setIsSelectionMode(false);
        setSelectedReceiptIds([]);
    }, []);

    const confirmSelectedReceiptsDelete = useCallback(() => {
        if (!selectedReceiptIds.length) {
            return;
        }

        Alert.alert(
            "Delete selected receipts?",
            `Delete ${selectedReceiptIds.length} selected receipt${selectedReceiptIds.length === 1 ? "" : "s"} and their linked expenses? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        void (async () => {
                            try {
                                setDeletingReceiptId(-1);
                                await Promise.all(selectedReceiptIds.map((id) => receiptApi.deleteReceipt(id)));
                                setReceipts((current) => current.filter((receipt) => !selectedReceiptIds.includes(receipt.id)));
                                exitSelectionMode();
                            } catch (error) {
                                Alert.alert("Unable to delete receipts", error instanceof ApiError ? error.message : "Please try again.");
                            } finally {
                                setDeletingReceiptId(null);
                            }
                        })();
                    },
                },
            ],
        );
    }, [exitSelectionMode, selectedReceiptIds]);

    return (
        <SafeAreaView edges={["top", "left", "right"]} style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 112 }]}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { closeSwipeableRows(); void loadReceipts(true); }} tintColor={theme.textPrimary} />}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.eyebrow, { color: theme.textMuted }]}>SAVED RECEIPTS</Text>
                <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>Receipts History</Text>
                    {isSelectionMode ? (
                        <View style={styles.historyActions}>
                            <Pressable accessibilityLabel="Delete selected receipts" disabled={!selectedReceiptIds.length || deletingReceiptId !== null} onPress={confirmSelectedReceiptsDelete} style={({ pressed }) => [styles.headerIconButton, (!selectedReceiptIds.length || deletingReceiptId !== null) && styles.disabled, pressed && styles.pressed]}>
                                <Ionicons color="#DC2626" name="trash-outline" size={21} />
                            </Pressable>
                            <Pressable accessibilityLabel="Cancel receipt selection" onPress={exitSelectionMode} style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}>
                                <Ionicons color={theme.textPrimary} name="close" size={23} />
                            </Pressable>
                        </View>
                    ) : (
                        <Pressable accessibilityLabel="Select receipts to delete" onPress={() => { closeSwipeableRows(); setIsSelectionMode(true); }} style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}>
                            <Ionicons color={theme.textPrimary} name="create-outline" size={21} />
                        </Pressable>
                    )}
                </View>
                {isLoading ? <View style={styles.loadingState}><ActivityIndicator color={theme.textPrimary} /></View> : null}
                {!isLoading && receipts.length === 0 ? (
                    <GlassCard contentStyle={styles.emptyCard} tintColor={theme.glassTint}>
                        <Ionicons color={theme.textMuted} name="receipt-outline" size={30} />
                        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No receipts yet</Text>
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Your confirmed scans will appear here.</Text>
                    </GlassCard>
                ) : null}
                <View style={styles.historyList}>
                    {receipts.map((receipt) => (
                        isSelectionMode ? (
                            <Pressable key={receipt.id} onPress={() => toggleReceiptSelection(receipt.id)} style={({ pressed }) => pressed && styles.pressed}>
                                <GlassCard contentStyle={styles.receiptCard} tintColor={theme.glassTint}>
                                    <View style={[styles.selectionBox, { borderColor: selectedReceiptIds.includes(receipt.id) ? theme.textPrimary : theme.textMuted, backgroundColor: selectedReceiptIds.includes(receipt.id) ? theme.textPrimary : "transparent" }]}>
                                        {selectedReceiptIds.includes(receipt.id) ? <Ionicons color={theme.primaryButtonText} name="checkmark" size={16} /> : null}
                                    </View>
                                    <View style={styles.receiptInfo}>
                                        <Text numberOfLines={1} style={[styles.merchant, { color: theme.textPrimary }]}>{receipt.merchant ?? "Unknown merchant"}</Text>
                                        <Text style={[styles.receiptMeta, { color: theme.textMuted }]}>{formatDate(receipt.receipt_date)} · {receipt.category ?? "Uncategorized"}</Text>
                                    </View>
                                    <Text style={[styles.amount, { color: theme.textPrimary }]}>{formatMoney(receipt.total)}</Text>
                                </GlassCard>
                            </Pressable>
                        ) : <Swipeable
                            key={receipt.id}
                            ref={(instance) => {
                                if (instance) swipeableRows.current.set(receipt.id, instance);
                                else swipeableRows.current.delete(receipt.id);
                            }}
                            onSwipeableWillOpen={() => closeSwipeableRows(receipt.id)}
                            overshootRight={false}
                            renderRightActions={() => (
                                <Pressable
                                    accessibilityLabel="Delete receipt"
                                    disabled={deletingReceiptId === receipt.id}
                                    onPress={() => confirmDeleteReceipt(receipt)}
                                    style={styles.deleteAction}
                                >
                                    {deletingReceiptId === receipt.id ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons color="#FFFFFF" name="trash-outline" size={23} />}
                                    <Text style={styles.deleteActionText}>Delete</Text>
                                </Pressable>
                            )}
                        >
                            <Pressable onPress={() => router.push({ pathname: "/(tabs)/receipt-detail", params: { receiptId: String(receipt.id) } })} style={({ pressed }) => pressed && styles.pressed}>
                                <GlassCard contentStyle={styles.receiptCard} tintColor={theme.glassTint}>
                                    <View style={styles.receiptIcon}><Ionicons color={theme.icon} name="receipt-outline" size={21} /></View>
                                    <View style={styles.receiptInfo}>
                                        <Text numberOfLines={1} style={[styles.merchant, { color: theme.textPrimary }]}>{receipt.merchant ?? "Unknown merchant"}</Text>
                                        <Text style={[styles.receiptMeta, { color: theme.textMuted }]}>{formatDate(receipt.receipt_date)} · {receipt.category ?? "Uncategorized"}</Text>
                                    </View>
                                    <View style={styles.amountColumn}>
                                        <Text style={[styles.amount, { color: theme.textPrimary }]}>{formatMoney(receipt.total)}</Text>
                                        <Ionicons color={theme.textMuted} name="chevron-forward" size={16} />
                                    </View>
                                </GlassCard>
                            </Pressable>
                        </Swipeable>
                    ))}
                </View>
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 }, content: { paddingHorizontal: 20, paddingTop: 17 }, eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.6 }, titleRow: { marginTop: 5, marginBottom: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { fontSize: 29, fontWeight: "800", letterSpacing: -0.8 }, pressed: { opacity: 0.72 }, disabled: { opacity: 0.58 }, historyActions: { flexDirection: "row", alignItems: "center", gap: 4 }, headerIconButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" }, loadingState: { minHeight: 150, alignItems: "center", justifyContent: "center" }, emptyCard: { minHeight: 172, padding: 24, alignItems: "center", justifyContent: "center" }, emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: "800" }, emptyText: { marginTop: 5, fontSize: 13, textAlign: "center" }, historyList: { gap: 10 }, receiptCard: { minHeight: 78, paddingHorizontal: 15, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 12 }, selectionBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, alignItems: "center", justifyContent: "center" }, receiptIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.14)" }, receiptInfo: { flex: 1 }, merchant: { fontSize: 14, fontWeight: "800" }, receiptMeta: { marginTop: 4, fontSize: 11 }, amountColumn: { alignItems: "flex-end", gap: 3 }, amount: { fontSize: 13, fontWeight: "800" }, deleteAction: { width: 94, marginLeft: 10, borderRadius: 22, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "#DC2626" }, deleteActionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
});
