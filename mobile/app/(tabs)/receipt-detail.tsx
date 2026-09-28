import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassButton, GlassCard } from "@/components/ui";
import { GASTIFY_THEMES, type GastifyColorScheme } from "@/constants/theme";
import { ApiError } from "@/services/api";
import { receiptApi } from "@/services/receiptApi";
import type { ReceiptDetailResponse } from "@/types/receipt";

function money(value: string | null | undefined) {
    const amount = Number(value);
    return Number.isFinite(amount) ? `PHP ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
}

function dateLabel(value: string) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

export default function ReceiptDetailScreen() {
    const scheme: GastifyColorScheme = useColorScheme() === "dark" ? "dark" : "light";
    const theme = GASTIFY_THEMES[scheme];
    const insets = useSafeAreaInsets();
    const { receiptId } = useLocalSearchParams<{ receiptId?: string }>();
    const id = Number(receiptId);
    const [receipt, setReceipt] = useState<ReceiptDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadReceipt = useCallback(async () => {
        if (!Number.isInteger(id) || id <= 0) {
            setError("This receipt is no longer available.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            setReceipt(await receiptApi.getReceipt(id));
        } catch (exception) {
            setError(exception instanceof ApiError ? exception.message : "Unable to load this receipt.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => { void loadReceipt(); }, [loadReceipt]);

    return (
        <SafeAreaView edges={["top", "left", "right"]} style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Pressable accessibilityLabel="Back to receipts" onPress={() => router.replace("/(tabs)/receipts")} style={({ pressed }) => [styles.backButton, { backgroundColor: theme.brandSurface, borderColor: theme.brandBorder }, pressed && styles.pressed]}>
                    <Ionicons color={theme.icon} name="arrow-back" size={22} />
                </Pressable>
                <View style={styles.headerCopy}>
                    <Text style={[styles.eyebrow, { color: theme.textMuted }]}>SAVED RECEIPT</Text>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>Receipt detail</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 34 }]} showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View style={styles.loading}><ActivityIndicator color={theme.textPrimary} size="large" /><Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading receipt…</Text></View>
                ) : error || !receipt ? (
                    <GlassCard contentStyle={styles.errorCard} tintColor={theme.glassTint}>
                        <Ionicons color={theme.textMuted} name="alert-circle-outline" size={38} />
                        <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>Receipt unavailable</Text>
                        <Text style={[styles.errorText, { color: theme.textSecondary }]}>{error ?? "Unable to load this receipt."}</Text>
                        <GlassButton label="Try again" onPress={() => void loadReceipt()} style={styles.retryButton} />
                    </GlassCard>
                ) : (
                    <>
                        <GlassCard contentStyle={styles.receipt} style={styles.receiptCard} tintColor={theme.glassTint}>
                            <View style={styles.receiptTop}>
                                <View style={[styles.receiptMark, { backgroundColor: theme.brandSurface, borderColor: theme.brandBorder }]}>
                                    <Ionicons color={theme.icon} name="receipt-outline" size={25} />
                                </View>
                                <View style={[styles.statusPill, { backgroundColor: "rgba(34,197,94,0.12)" }]}>
                                    <Ionicons color="#16A34A" name="checkmark-circle" size={14} />
                                    <Text style={styles.statusText}>Confirmed</Text>
                                </View>
                            </View>
                            <Text style={[styles.merchant, { color: theme.textPrimary }]}>{receipt.merchant ?? "Unknown merchant"}</Text>
                            <Text style={[styles.date, { color: theme.textMuted }]}>{dateLabel(receipt.receipt_date)}</Text>
                            {receipt.ocr?.reference_number ? <Text style={[styles.reference, { color: theme.textMuted }]}>Ref. {receipt.ocr.reference_number}</Text> : null}

                            <View style={[styles.divider, { borderColor: theme.brandBorder }]} />
                            <View style={styles.columnHeader}>
                                <Text style={[styles.columnLabel, { color: theme.textMuted }]}>ITEM</Text>
                                <Text style={[styles.columnLabel, { color: theme.textMuted }]}>AMOUNT</Text>
                            </View>
                            {receipt.items.length ? receipt.items.map((item) => (
                                <View key={item.id} style={styles.itemRow}>
                                    <View style={styles.itemInfo}>
                                        <Text style={[styles.itemName, { color: theme.textPrimary }]}>{item.name}</Text>
                                        <Text style={[styles.itemSubtext, { color: theme.textMuted }]}>Qty {item.quantity} × {money(item.unit_price)}</Text>
                                    </View>
                                    <Text style={[styles.itemAmount, { color: theme.textPrimary }]}>{money(String(Number(item.quantity) * Number(item.unit_price)))}</Text>
                                </View>
                            )) : <Text style={[styles.emptyItems, { color: theme.textMuted }]}>No line items were saved.</Text>}

                            <View style={[styles.divider, { borderColor: theme.brandBorder }]} />
                            {receipt.ocr?.subtotal ? <TotalLine label="Subtotal" theme={theme} value={money(receipt.ocr.subtotal)} /> : null}
                            {receipt.ocr?.tax ? <TotalLine label="VAT" theme={theme} value={money(receipt.ocr.tax)} /> : null}
                            {receipt.ocr?.discount ? <TotalLine label="Discount" theme={theme} value={money(receipt.ocr.discount)} /> : null}
                            <View style={styles.grandTotal}>
                                <Text style={[styles.grandTotalLabel, { color: theme.textPrimary }]}>TOTAL</Text>
                                <Text style={[styles.grandTotalValue, { color: theme.textPrimary }]}>{money(receipt.total)}</Text>
                            </View>
                            {receipt.ocr?.payment_method ? <Text style={[styles.payment, { color: theme.textMuted }]}>{receipt.ocr.payment_method}</Text> : null}
                        </GlassCard>

                        <GlassCard contentStyle={styles.metaCard} style={styles.metaCardOuter} tintColor={theme.glassTint}>
                            <MetaLine icon="pricetag-outline" label="Category" theme={theme} value={receipt.category ?? "Uncategorized"} />
                            <MetaLine icon="chatbubble-outline" label="Note" theme={theme} value={receipt.note ?? "No note"} />
                            <MetaLine icon="calendar-outline" label="Saved" theme={theme} value={new Date(receipt.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} />
                        </GlassCard>

                        {receipt.ocr?.warnings.length ? <View style={styles.warning}><Ionicons color="#F59E0B" name="warning-outline" size={19} /><Text style={[styles.warningText, { color: theme.textSecondary }]}>{receipt.ocr.warnings.join(" ")}</Text></View> : null}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function TotalLine({ label, value, theme }: { label: string; value: string; theme: (typeof GASTIFY_THEMES)[GastifyColorScheme] }) {
    return <View style={styles.totalLine}><Text style={[styles.totalLineLabel, { color: theme.textMuted }]}>{label}</Text><Text style={[styles.totalLineValue, { color: theme.textPrimary }]}>{value}</Text></View>;
}

function MetaLine({ icon, label, value, theme }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; theme: (typeof GASTIFY_THEMES)[GastifyColorScheme] }) {
    return <View style={[styles.metaLine, { borderBottomColor: theme.brandBorder }]}><Ionicons color={theme.textMuted} name={icon} size={17} /><Text style={[styles.metaLabel, { color: theme.textMuted }]}>{label}</Text><Text numberOfLines={2} style={[styles.metaValue, { color: theme.textPrimary }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 13, flexDirection: "row", alignItems: "center" },
    backButton: { width: 44, height: 44, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
    headerCopy: { marginLeft: 13 },
    eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
    title: { marginTop: 2, fontSize: 25, fontWeight: "800", letterSpacing: -0.6 },
    content: { paddingHorizontal: 20, paddingTop: 8 },
    loading: { minHeight: 360, alignItems: "center", justifyContent: "center", gap: 12 },
    loadingText: { fontSize: 13 },
    errorCard: { minHeight: 300, padding: 25, alignItems: "center", justifyContent: "center" },
    errorTitle: { marginTop: 14, fontSize: 19, fontWeight: "800" },
    errorText: { marginTop: 7, fontSize: 13, lineHeight: 19, textAlign: "center" },
    retryButton: { alignSelf: "stretch", marginTop: 22 },
    receiptCard: { borderRadius: 28 },
    receipt: { padding: 22 },
    receiptTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    receiptMark: { width: 50, height: 50, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
    statusPill: { minHeight: 29, paddingHorizontal: 10, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 5 },
    statusText: { color: "#16A34A", fontSize: 11, fontWeight: "800" },
    merchant: { marginTop: 19, fontSize: 21, fontWeight: "800", letterSpacing: -0.35 },
    date: { marginTop: 5, fontSize: 13 },
    reference: { marginTop: 4, fontSize: 11 },
    divider: { marginVertical: 18, borderTopWidth: StyleSheet.hairlineWidth, borderStyle: "dashed" },
    columnHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    columnLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
    itemRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 14 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: "700" },
    itemSubtext: { marginTop: 3, fontSize: 11 },
    itemAmount: { fontSize: 13, fontWeight: "800" },
    emptyItems: { paddingVertical: 16, textAlign: "center", fontSize: 13 },
    totalLine: { minHeight: 25, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    totalLineLabel: { fontSize: 12 },
    totalLineValue: { fontSize: 12, fontWeight: "600" },
    grandTotal: { marginTop: 8, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
    grandTotalLabel: { fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
    grandTotalValue: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
    payment: { marginTop: 10, fontSize: 11, textAlign: "right", textTransform: "uppercase" },
    metaCardOuter: { marginTop: 14, borderRadius: 24 },
    metaCard: { paddingHorizontal: 18, paddingVertical: 3 },
    metaLine: { minHeight: 55, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
    metaLabel: { fontSize: 12 },
    metaValue: { flex: 1, fontSize: 13, fontWeight: "700", textAlign: "right", textTransform: "capitalize" },
    warning: { marginTop: 13, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: "rgba(245,158,11,0.10)" },
    warningText: { flex: 1, fontSize: 12, lineHeight: 18 },
    pressed: { opacity: 0.72 },
});
