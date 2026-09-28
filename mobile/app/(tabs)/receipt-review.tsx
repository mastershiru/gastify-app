import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
    GlassButton,
    GlassCard,
} from "@/components/ui";
import { GASTIFY_THEMES, type GastifyColorScheme } from "@/constants/theme";
import { ApiError } from "@/services/api";
import { receiptApi } from "@/services/receiptApi";
import { useReceiptDraft } from "@/store/ReceiptDraftProvider";

function money(value: string | null | undefined) {
    const amount = Number(value);
    return Number.isFinite(amount) ? `PHP ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
}

function formatDate(value: string | null) {
    if (!value) return "Date not detected";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

export default function ReceiptReviewScreen() {
    const scheme: GastifyColorScheme = useColorScheme() === "dark" ? "dark" : "light";
    const theme = GASTIFY_THEMES[scheme];
    const insets = useSafeAreaInsets();
    const { draft, clearDraft } = useReceiptDraft();
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmedExpenseId, setConfirmedExpenseId] = useState<number | null>(null);
    const parsed = draft?.parsed;

    const confirmItems = useMemo(() => (parsed?.items ?? []).map((item) => {
        const quantity = Number(item.quantity);
        const amount = Number(item.amount);
        const unitPrice = Number(item.unit_price);
        const derivedPrice = Number.isFinite(unitPrice) ? unitPrice : amount / quantity;
        return {
            name: item.name.trim(),
            quantity: String(quantity),
            unit_price: String(derivedPrice),
        };
    }).filter((item) => item.name && Number(item.quantity) > 0 && Number.isFinite(Number(item.unit_price))), [parsed]);

    const confirmReceipt = async () => {
        if (!draft || !parsed || isConfirming) return;
        if (!parsed.receipt_date || !parsed.total || Number(parsed.total) <= 0 || confirmItems.length === 0) {
            Alert.alert("Receipt needs another scan", "Some required receipt details could not be read. Please scan a clearer image.");
            return;
        }
        setIsConfirming(true);
        try {
            const response = await receiptApi.confirmReceipt({
                draft_id: draft.draft_id,
                merchant: parsed.merchant?.trim() || null,
                receipt_date: parsed.receipt_date,
                items: confirmItems,
                total: parsed.total,
                category: null,
                note: null,
            });
            try {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
                // Haptics are optional.
            }
            setConfirmedExpenseId(response.expense_id);
        } catch (error) {
            Alert.alert("Unable to confirm receipt", error instanceof ApiError ? error.message : "The receipt could not be confirmed.");
        } finally {
            setIsConfirming(false);
        }
    };

    if (!draft || !parsed) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
                <View style={styles.emptyState}>
                    <Ionicons color={theme.textMuted} name="receipt-outline" size={42} />
                    <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No receipt draft</Text>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Scan a receipt before reviewing it.</Text>
                    <Pressable onPress={() => router.replace("/(tabs)/receipts")} style={[styles.returnButton, { backgroundColor: theme.primaryButton }]}>
                        <Text style={[styles.returnButtonText, { color: theme.primaryButtonText }]}>Go to Receipts</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={["top", "left", "right"]} style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.eyebrow, { color: theme.textMuted }]}>RECEIPT</Text>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>Review</Text>
                </View>
                <GlassButton
                    disabled={isConfirming}
                    haptics={false}
                    label={isConfirming ? "Confirming" : "Confirm"}
                    onPress={() => void confirmReceipt()}
                    style={styles.confirmButton}
                    variant="glass"
                />
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 32 }]} showsVerticalScrollIndicator={false}>
                <View style={styles.notice}>
                    <Ionicons color={theme.textMuted} name="lock-closed-outline" size={16} />
                    <Text style={[styles.noticeText, { color: theme.textSecondary }]}>Your receipt has been read and is ready to confirm.</Text>
                </View>

                <GlassCard contentStyle={styles.receipt} style={styles.receiptCard} tintColor={theme.glassTint}>
                    <View style={styles.receiptHeading}>
                        <Ionicons color={theme.icon} name="receipt-outline" size={28} />
                        <Text style={[styles.merchant, { color: theme.textPrimary }]}>{parsed.merchant ?? "Unknown merchant"}</Text>
                        <Text style={[styles.date, { color: theme.textMuted }]}>{formatDate(parsed.receipt_date)}</Text>
                        {parsed.reference_number ? <Text style={[styles.reference, { color: theme.textMuted }]}>Ref. {parsed.reference_number}</Text> : null}
                    </View>

                    <View style={[styles.divider, { borderColor: theme.brandBorder }]} />
                    <View style={styles.columns}>
                        <Text style={[styles.columnName, { color: theme.textMuted }]}>ITEM</Text>
                        <Text style={[styles.columnAmount, { color: theme.textMuted }]}>AMOUNT</Text>
                    </View>
                    {parsed.items.length ? parsed.items.map((item, index) => (
                        <View key={`${item.name}-${index}`} style={styles.itemRow}>
                            <View style={styles.itemDescription}>
                                <Text style={[styles.itemName, { color: theme.textPrimary }]}>{item.name}</Text>
                                <Text style={[styles.itemQuantity, { color: theme.textMuted }]}>Qty {item.quantity}{item.unit_price ? ` × ${money(item.unit_price)}` : ""}</Text>
                            </View>
                            <Text style={[styles.itemAmount, { color: theme.textPrimary }]}>{money(item.amount)}</Text>
                        </View>
                    )) : <Text style={[styles.noItems, { color: theme.textMuted }]}>No line items were detected.</Text>}

                    <View style={[styles.divider, { borderColor: theme.brandBorder }]} />
                    {parsed.subtotal ? <SummaryRow label="Subtotal" value={money(parsed.subtotal)} theme={theme} /> : null}
                    {parsed.tax ? <SummaryRow label="VAT" value={money(parsed.tax)} theme={theme} /> : null}
                    {parsed.discount ? <SummaryRow label="Discount" value={money(parsed.discount)} theme={theme} /> : null}
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: theme.textPrimary }]}>TOTAL</Text>
                        <Text style={[styles.totalAmount, { color: theme.textPrimary }]}>{money(parsed.total)}</Text>
                    </View>
                    {parsed.payment_method ? <Text style={[styles.payment, { color: theme.textMuted }]}>{parsed.payment_method}</Text> : null}
                </GlassCard>

                {parsed.warnings.length ? (
                    <View style={styles.warning}>
                        <Ionicons color="#F59E0B" name="warning-outline" size={19} />
                        <Text style={[styles.warningText, { color: theme.textSecondary }]}>{parsed.warnings.join(" ")}</Text>
                    </View>
                ) : null}
            </ScrollView>

            <Modal
                animationType="fade"
                statusBarTranslucent
                transparent
                visible={confirmedExpenseId !== null}
            >
                <BlurView
                    intensity={58}
                    style={styles.confirmationOverlay}
                    tint={scheme === "dark" ? "dark" : "light"}
                >
                    <GlassCard
                        contentStyle={styles.confirmationCardContent}
                        style={styles.confirmationCard}
                        tintColor={theme.glassTint}
                    >
                        <View style={[styles.confirmationIcon, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
                            <Ionicons color="#16A34A" name="checkmark" size={26} />
                        </View>
                        <Text style={[styles.confirmationTitle, { color: theme.textPrimary }]}>Receipt confirmed</Text>
                        <Text style={[styles.confirmationText, { color: theme.textSecondary }]}>Saved as expense #{confirmedExpenseId}.</Text>
                        <Pressable
                            onPress={() => {
                                clearDraft();
                                router.replace("/(tabs)/receipts");
                            }}
                            style={({ pressed }) => [
                                styles.doneButton,
                                {
                                    backgroundColor:
                                        scheme === "dark"
                                            ? "#F8FAFC"
                                            : "#0F172A",
                                    borderColor:
                                        scheme === "dark"
                                            ? "rgba(255,255,255,0.86)"
                                            : "rgba(15,23,42,0.92)",
                                },
                                pressed && styles.dimmed,
                            ]}
                        >
                            <Text style={[styles.doneText, { color: scheme === "dark" ? "#07110E" : "#FFFFFF" }]}>Done</Text>
                        </Pressable>
                    </GlassCard>
                </BlurView>
            </Modal>
        </SafeAreaView>
    );
}

function SummaryRow({ label, value, theme }: { label: string; value: string; theme: (typeof GASTIFY_THEMES)[GastifyColorScheme] }) {
    return <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{label}</Text><Text style={[styles.summaryValue, { color: theme.textPrimary }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: { minHeight: 76, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
    eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
    title: { marginTop: 2, fontSize: 25, fontWeight: "800", letterSpacing: -0.6 },
    confirmButton: { minWidth: 96 },
    content: { paddingHorizontal: 20, paddingTop: 4 },
    notice: { paddingHorizontal: 5, paddingBottom: 17, flexDirection: "row", alignItems: "center", gap: 8 },
    noticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
    receiptCard: { borderRadius: 28 },
    receipt: { padding: 22 },
    receiptHeading: { alignItems: "center" },
    merchant: { marginTop: 9, fontSize: 20, fontWeight: "800", textAlign: "center" },
    date: { marginTop: 5, fontSize: 12 },
    reference: { marginTop: 3, fontSize: 11 },
    divider: { marginVertical: 18, borderTopWidth: StyleSheet.hairlineWidth, borderStyle: "dashed" },
    columns: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    columnName: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
    columnAmount: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
    itemRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 14 },
    itemDescription: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: "700" },
    itemQuantity: { marginTop: 3, fontSize: 11 },
    itemAmount: { fontSize: 13, fontWeight: "800" },
    noItems: { paddingVertical: 15, fontSize: 13, textAlign: "center" },
    summaryRow: { minHeight: 25, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    summaryLabel: { fontSize: 12 },
    summaryValue: { fontSize: 12, fontWeight: "600" },
    totalRow: { marginTop: 8, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
    totalLabel: { fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
    totalAmount: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
    payment: { marginTop: 10, fontSize: 11, textAlign: "right", textTransform: "uppercase" },
    warning: { marginTop: 14, padding: 14, borderRadius: 18, flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: "rgba(245,158,11,0.10)" },
    warningText: { flex: 1, fontSize: 12, lineHeight: 18 },
    confirmationOverlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
    confirmationCard: { width: "100%", maxWidth: 330, borderRadius: 28 },
    confirmationCardContent: { padding: 28, alignItems: "center" },
    confirmationIcon: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
    confirmationTitle: { marginTop: 16, fontSize: 20, fontWeight: "800" },
    confirmationText: { marginTop: 6, fontSize: 13, textAlign: "center" },
    doneButton: { alignSelf: "stretch", minHeight: 50, marginTop: 24, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
    doneText: { fontSize: 14, fontWeight: "800" },
    dimmed: { opacity: 0.72 },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
    emptyTitle: { marginTop: 15, fontSize: 21, fontWeight: "800" },
    emptyText: { marginTop: 7, fontSize: 14, textAlign: "center" },
    returnButton: { minHeight: 50, marginTop: 24, paddingHorizontal: 20, borderRadius: 17, alignItems: "center", justifyContent: "center" },
    returnButtonText: { fontSize: 14, fontWeight: "800" },
});
