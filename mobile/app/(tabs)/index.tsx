import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/ui";
import { GASTIFY_THEMES, type GastifyColorScheme } from "@/constants/theme";
import { ApiError } from "@/services/api";
import { expenseApi, type ExpenseResponse } from "@/services/expenseApi";
import { receiptApi } from "@/services/receiptApi";
import { useReceiptDraft } from "@/store/ReceiptDraftProvider";

function money(value: number) {
    return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function HomeScreen() {
    const scheme: GastifyColorScheme = useColorScheme() === "dark" ? "dark" : "light";
    const theme = GASTIFY_THEMES[scheme];
    const insets = useSafeAreaInsets();
    const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const { setDraft } = useReceiptDraft();
    const load = useCallback(async (refresh = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setIsLoading(true);
        }
        try { setExpenses((await expenseApi.getExpenses()).expenses); }
        catch (error) { Alert.alert("Dashboard unavailable", error instanceof ApiError ? error.message : "Unable to load expenses."); }
        finally { setIsLoading(false); setRefreshing(false); }
    }, []);
    useEffect(() => { void load(); }, [load]);
    const scanReceipt = async (source: "camera" | "gallery") => {
        try {
            if (source === "camera") {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) { Alert.alert("Camera permission needed", "Allow camera access to scan a receipt."); return; }
            }
            const result = source === "camera" ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9, cameraType: ImagePicker.CameraType.back }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
            if (result.canceled || !result.assets[0]) return;
            setIsScanning(true);
            await new Promise<void>((resolve) => {
                requestAnimationFrame(() => resolve());
            });
            setDraft(await receiptApi.parseReceipt({ uri: result.assets[0].uri, fileName: result.assets[0].fileName ?? null, mimeType: result.assets[0].mimeType ?? null }));
            router.push("/(tabs)/receipt-review");
        } catch (error) {
            Alert.alert("Receipt scan failed", error instanceof ApiError ? error.message : "We could not read that image.");
        } finally {
            setIsScanning(false);
        }
    };
    const chooseReceiptSource = () => Alert.alert("Scan a receipt", "Choose where to get your receipt image.", [{ text: "Take a photo", onPress: () => void scanReceipt("camera") }, { text: "Choose from gallery", onPress: () => void scanReceipt("gallery") }, { text: "Cancel", style: "cancel" }]);
    const monthlyTotal = useMemo(() => {
        const now = new Date();
        return expenses.filter((expense) => {
            const date = new Date(`${expense.date}T00:00:00`);
            return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
        }).reduce((total, expense) => total + Number(expense.amount), 0);
    }, [expenses]);
    const month = new Date().toLocaleDateString("en-PH", { month: "long" });

    return <SafeAreaView edges={["top", "left", "right"]} style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 112 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.textPrimary} />}>
            <Text style={[styles.eyebrow, { color: theme.textMuted }]}>GASTIFY</Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Your spending, clear.</Text>
            <GlassCard contentStyle={styles.totalCard} style={styles.totalCardOuter} tintColor={theme.glassTint}>
                <View><Text style={[styles.totalLabel, { color: theme.textSecondary }]}>{month.toUpperCase()} EXPENSES</Text><Text style={[styles.total, { color: theme.textPrimary }]}>{isLoading ? "—" : money(monthlyTotal)}</Text></View>
                <View style={[styles.totalIcon, { backgroundColor: theme.brandSurface }]}><Ionicons color={theme.icon} name="wallet-outline" size={25} /></View>
            </GlassCard>
            <Text style={[styles.sectionTitle, styles.quickActionsTitle, { color: theme.textPrimary }]}>Quick actions</Text>
            <View style={styles.actions}>
                <QuickAction icon="scan-outline" label="Scan receipt" onPress={chooseReceiptSource} theme={theme} />
                <QuickAction icon="create-outline" label="Add manually" onPress={() => router.push("/(tabs)/manual-expense")} theme={theme} />
                <QuickAction icon="list-outline" label="All expenses" onPress={() => router.push("/(tabs)/expenses")} theme={theme} />
            </View>
            <View style={styles.historyHeader}><Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent expenses</Text><Pressable onPress={() => router.push("/(tabs)/expenses")}><Text style={[styles.viewAll, { color: theme.textSecondary }]}>View all</Text></Pressable></View>
            {isLoading ? <View style={styles.loading}><ActivityIndicator color={theme.textPrimary} /></View> : expenses.slice(0, 4).map((expense) => <GlassCard key={expense.id} contentStyle={styles.row} style={styles.rowOuter} tintColor={theme.glassTint}><View style={[styles.rowIcon, { backgroundColor: theme.brandSurface }]}><Ionicons color={theme.icon} name={expense.source === "manual" ? "create-outline" : "receipt-outline"} size={18} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{expense.category ?? (expense.source === "manual" ? "Manual expense" : "Receipt expense")}</Text><Text style={[styles.rowDate, { color: theme.textMuted }]}>{expense.date}</Text></View><Text style={[styles.rowAmount, { color: theme.textPrimary }]}>{money(Number(expense.amount))}</Text></GlassCard>)}
            {!isLoading && expenses.length === 0 ? <GlassCard contentStyle={styles.empty} tintColor={theme.glassTint}><Text style={[styles.emptyText, { color: theme.textSecondary }]}>Your recent expenses will appear here.</Text></GlassCard> : null}
        </ScrollView>
        <Modal animationType="fade" statusBarTranslucent transparent visible={isScanning}><BlurView intensity={58} style={styles.scanOverlay} tint={scheme === "dark" ? "dark" : "light"}><View style={[styles.scanOverlayCard, { backgroundColor: theme.glassSurface, borderColor: theme.glassBorder }]}><ActivityIndicator color={theme.textPrimary} size="large" /><Text style={[styles.scanOverlayTitle, { color: theme.textPrimary }]}>Reading receipt…</Text><Text style={[styles.scanOverlayText, { color: theme.textSecondary }]}>We’re extracting the details for you.</Text></View></BlurView></Modal>
    </SafeAreaView>;
}

function QuickAction({ icon, label, onPress, theme }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; theme: (typeof GASTIFY_THEMES)[GastifyColorScheme] }) {
    return <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}><View style={[styles.quickActionCircle, { backgroundColor: theme.brandSurface, borderColor: theme.brandBorder }]}><Ionicons color={theme.icon} name={icon} size={23} /></View><Text numberOfLines={2} style={[styles.quickActionLabel, { color: theme.textPrimary }]}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({
    safeArea: { flex: 1 }, content: { paddingHorizontal: 20, paddingTop: 17 }, eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.6 }, title: { marginTop: 5, fontSize: 29, fontWeight: "800", letterSpacing: -0.8 }, totalCardOuter: { marginTop: 23, borderRadius: 28 }, totalCard: { minHeight: 144, padding: 21, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, totalLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.1 }, total: { marginTop: 9, fontSize: 30, fontWeight: "900", letterSpacing: -0.8 }, totalIcon: { width: 56, height: 56, borderRadius: 19, alignItems: "center", justifyContent: "center" }, sectionTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 }, quickActionsTitle: { marginTop: 26 }, actions: { marginTop: 13, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-around" }, quickAction: { width: 88, alignItems: "center", gap: 8 }, quickActionCircle: { width: 62, height: 62, borderRadius: 31, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", shadowColor: "#020617", shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.12, shadowRadius: 13, elevation: 6 }, quickActionLabel: { minHeight: 30, fontSize: 11, fontWeight: "800", lineHeight: 14, textAlign: "center" }, historyHeader: { marginTop: 29, marginBottom: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, viewAll: { fontSize: 12, fontWeight: "700" }, rowOuter: { marginBottom: 9, borderRadius: 20 }, row: { minHeight: 68, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 11 }, rowIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" }, rowCopy: { flex: 1 }, rowTitle: { fontSize: 13, fontWeight: "800" }, rowDate: { marginTop: 3, fontSize: 11 }, rowAmount: { fontSize: 13, fontWeight: "800" }, loading: { minHeight: 130, alignItems: "center", justifyContent: "center" }, empty: { minHeight: 110, padding: 20, alignItems: "center", justifyContent: "center" }, emptyText: { fontSize: 13 }, scanOverlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 }, scanOverlayCard: { width: "100%", maxWidth: 320, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, padding: 30, alignItems: "center" }, scanOverlayTitle: { marginTop: 18, fontSize: 19, fontWeight: "800" }, scanOverlayText: { marginTop: 7, fontSize: 13, lineHeight: 19, textAlign: "center" }, pressed: { opacity: 0.72 },
});
