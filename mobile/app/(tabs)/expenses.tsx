import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/ui";
import { GASTIFY_THEMES, type GastifyColorScheme } from "@/constants/theme";
import { ApiError } from "@/services/api";
import { expenseApi, type ExpenseResponse } from "@/services/expenseApi";

function money(value: string) {
    const amount = Number(value);
    return Number.isFinite(amount) ? `PHP ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `PHP ${value}`;
}

function dateLabel(value: string) {
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export default function ExpensesScreen() {
    const scheme: GastifyColorScheme = useColorScheme() === "dark" ? "dark" : "light";
    const theme = GASTIFY_THEMES[scheme];
    const insets = useSafeAreaInsets();
    const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadExpenses = useCallback(async (refresh = false) => {
        if (refresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        try {
            setExpenses((await expenseApi.getExpenses()).expenses);
        } catch (error) {
            Alert.alert("Expenses unavailable", error instanceof ApiError ? error.message : "Unable to load expenses.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { void loadExpenses(); }, [loadExpenses]);

    return (
        <SafeAreaView edges={["top", "left", "right"]} style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Pressable accessibilityLabel="Back to home" onPress={() => router.replace("/(tabs)")} style={[styles.backButton, { backgroundColor: theme.brandSurface, borderColor: theme.brandBorder }]}><Ionicons color={theme.icon} name="arrow-back" size={22} /></Pressable>
                <View style={styles.headerCopy}><Text style={[styles.eyebrow, { color: theme.textMuted }]}>EXPENSES</Text><Text style={[styles.title, { color: theme.textPrimary }]}>All expenses</Text></View>
                <Pressable accessibilityLabel="Add manual expense" onPress={() => router.push("/(tabs)/manual-expense")} style={[styles.addButton, { backgroundColor: theme.primaryButton }]}><Ionicons color={theme.primaryButtonText} name="add" size={23} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 30 }]} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadExpenses(true)} tintColor={theme.textPrimary} />}>
                {isLoading ? <View style={styles.loading}><ActivityIndicator color={theme.textPrimary} /></View> : expenses.length === 0 ? <GlassCard contentStyle={styles.empty} tintColor={theme.glassTint}><Ionicons color={theme.textMuted} name="wallet-outline" size={31} /><Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No expenses yet</Text><Text style={[styles.emptyText, { color: theme.textSecondary }]}>Receipt scans and manual entries will appear here.</Text></GlassCard> : <View style={styles.list}>{expenses.map((expense) => <GlassCard key={expense.id} contentStyle={styles.expenseCard} tintColor={theme.glassTint}><View style={[styles.expenseIcon, { backgroundColor: theme.brandSurface }]}><Ionicons color={theme.icon} name={expense.source === "manual" ? "create-outline" : "receipt-outline"} size={20} /></View><View style={styles.expenseInfo}><Text style={[styles.expenseTitle, { color: theme.textPrimary }]}>{expense.category ?? (expense.source === "manual" ? "Manual expense" : "Receipt expense")}</Text><Text style={[styles.expenseMeta, { color: theme.textMuted }]}>{dateLabel(expense.date)}{expense.note ? ` · ${expense.note}` : ""}</Text></View><Text style={[styles.expenseAmount, { color: theme.textPrimary }]}>{money(expense.amount)}</Text></GlassCard>)}</View>}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 }, header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 13, flexDirection: "row", alignItems: "center" }, backButton: { width: 44, height: 44, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" }, headerCopy: { flex: 1, marginLeft: 13 }, eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5 }, title: { marginTop: 2, fontSize: 25, fontWeight: "800", letterSpacing: -0.6 }, addButton: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" }, content: { paddingHorizontal: 20, paddingTop: 8 }, loading: { minHeight: 300, alignItems: "center", justifyContent: "center" }, empty: { minHeight: 190, padding: 24, alignItems: "center", justifyContent: "center" }, emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: "800" }, emptyText: { marginTop: 5, fontSize: 13, textAlign: "center" }, list: { gap: 10 }, expenseCard: { minHeight: 74, paddingHorizontal: 15, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 12 }, expenseIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, expenseInfo: { flex: 1 }, expenseTitle: { fontSize: 14, fontWeight: "800" }, expenseMeta: { marginTop: 4, fontSize: 11 }, expenseAmount: { fontSize: 13, fontWeight: "800" },
});
