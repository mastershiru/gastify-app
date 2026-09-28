import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
    useState,
} from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
    GlassButton,
    GlassCard,
} from "@/components/ui";
import {
    GASTIFY_THEMES,
    type GastifyColorScheme,
} from "@/constants/theme";
import { ApiError } from "@/services/api";
import { expenseApi } from "@/services/expenseApi";


function todayIso(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${today.getFullYear()}-${month}-${day}`;
}


export default function ManualExpenseScreen() {
    const scheme: GastifyColorScheme =
        useColorScheme() === "dark" ? "dark" : "light";
    const theme = GASTIFY_THEMES[scheme];
    const insets = useSafeAreaInsets();
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(todayIso);
    const [category, setCategory] = useState("");
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const saveExpense = async () => {
        const normalizedAmount = amount.replace(/,/g, "").trim();

        if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount) || Number(normalizedAmount) <= 0) {
            Alert.alert("Enter a valid amount", "Use an amount greater than zero.");
            return;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
            Alert.alert("Enter a valid date", "Use the YYYY-MM-DD format.");
            return;
        }

        setIsSaving(true);

        try {
            await expenseApi.createManualExpense({
                amount: normalizedAmount,
                date: date.trim(),
                category: category.trim() || null,
                note: note.trim() || null,
            });

            try {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
                // Haptics are optional.
            }

            setAmount("");
            setDate(todayIso());
            setCategory("");
            setNote("");
            router.replace("/(tabs)/expenses");
        } catch (error) {
            Alert.alert("Unable to save expense", error instanceof ApiError ? error.message : "Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView edges={["top", "left", "right"]} style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Pressable accessibilityLabel="Back to home" onPress={() => router.replace("/(tabs)")} style={[styles.backButton, { backgroundColor: theme.brandSurface, borderColor: theme.brandBorder }]}>
                    <Ionicons color={theme.icon} name="arrow-back" size={22} />
                </Pressable>
                <View style={styles.headerCopy}>
                    <Text style={[styles.eyebrow, { color: theme.textMuted }]}>EXPENSE</Text>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>Manual entry</Text>
                </View>
            </View>
            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 30 }]} keyboardShouldPersistTaps="handled">
                <GlassCard contentStyle={styles.form} tintColor={theme.glassTint}>
                    <Field label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" prefix="PHP" theme={theme} keyboardType="decimal-pad" />
                    <Field label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" theme={theme} keyboardType="numbers-and-punctuation" />
                    <Field label="Category" value={category} onChangeText={setCategory} placeholder="Optional" theme={theme} />
                    <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional" theme={theme} multiline />
                </GlassCard>
                <GlassButton disabled={isSaving} label={isSaving ? "Saving…" : "Save expense"} onPress={() => void saveExpense()} style={styles.saveButton} variant="primary" />
            </ScrollView>
        </SafeAreaView>
    );
}


function Field({ label, value, onChangeText, placeholder, theme, keyboardType = "default", multiline = false, prefix }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; theme: (typeof GASTIFY_THEMES)[GastifyColorScheme]; keyboardType?: "default" | "decimal-pad" | "numbers-and-punctuation"; multiline?: boolean; prefix?: string }) {
    return <View style={styles.field}><Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text><View style={[styles.inputShell, { backgroundColor: theme.brandSurface, borderColor: theme.brandBorder }]}>{prefix ? <Text style={[styles.prefix, { color: theme.textMuted }]}>{prefix}</Text> : null}<TextInput multiline={multiline} keyboardType={keyboardType} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.textMuted} style={[styles.input, multiline && styles.multiline, { color: theme.textPrimary }]} value={value} /></View></View>;
}


const styles = StyleSheet.create({
    safeArea: { flex: 1 }, header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 13, flexDirection: "row", alignItems: "center" }, backButton: { width: 44, height: 44, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" }, headerCopy: { marginLeft: 13 }, eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5 }, title: { marginTop: 2, fontSize: 25, fontWeight: "800", letterSpacing: -0.6 }, content: { paddingHorizontal: 20, paddingTop: 8 }, form: { borderRadius: 26, padding: 19, gap: 17 }, field: { gap: 7 }, fieldLabel: { fontSize: 13, fontWeight: "700" }, inputShell: { minHeight: 52, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" }, prefix: { marginRight: 7, fontSize: 13, fontWeight: "700" }, input: { flex: 1, minHeight: 50, fontSize: 15 }, multiline: { minHeight: 92, paddingTop: 14, paddingBottom: 14, textAlignVertical: "top" }, saveButton: { marginTop: 15 },
});
