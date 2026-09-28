import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassCard } from "@/components/ui";
import { GASTIFY_THEMES, type GastifyColorScheme } from "@/constants/theme";
import { getNotificationById, type GastifyNotification } from "@/services/notifications";

export default function NotificationDetailScreen() {
    const scheme: GastifyColorScheme = useColorScheme() === "dark" ? "dark" : "light";
    const theme = GASTIFY_THEMES[scheme];
    const { id } = useLocalSearchParams<{ id: string }>();
    const [notification, setNotification] = useState<GastifyNotification | null | undefined>(undefined);
    useEffect(() => { void getNotificationById(id).then(setNotification); }, [id]);
    return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={styles.content}><Pressable accessibilityLabel="Back to notifications" onPress={() => router.replace("/(tabs)/notifications")} style={[styles.back, { backgroundColor: theme.brandSurface }]}><Ionicons color={theme.icon} name="arrow-back" size={22} /></Pressable><Text style={[styles.eyebrow, { color: theme.textMuted }]}>NOTIFICATION</Text>{notification === undefined ? <ActivityIndicator color={theme.textPrimary} style={styles.loader} /> : notification ? <GlassCard contentStyle={styles.card} style={styles.cardOuter} tintColor={theme.glassTint}><View style={[styles.icon, { backgroundColor: theme.brandSurface }]}><Ionicons color={theme.icon} name="notifications-outline" size={28} /></View><Text style={[styles.title, { color: theme.textPrimary }]}>{notification.title}</Text><Text style={[styles.date, { color: theme.textMuted }]}>{new Date(notification.receivedAt).toLocaleString("en-PH", { dateStyle: "full", timeStyle: "short" })}</Text><View style={[styles.divider, { backgroundColor: theme.brandBorder }]} /><Text style={[styles.body, { color: theme.textSecondary }]}>{notification.body}</Text></GlassCard> : <GlassCard contentStyle={styles.missing} tintColor={theme.glassTint}><Text style={[styles.missingText, { color: theme.textSecondary }]}>This notification is no longer available.</Text></GlassCard>}</View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, content: { flex: 1, paddingHorizontal: 20, paddingTop: 17 }, back: { width: 48, height: 48, borderRadius: 17, alignItems: "center", justifyContent: "center" }, eyebrow: { marginTop: 24, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 }, loader: { marginTop: 90 }, cardOuter: { marginTop: 12, borderRadius: 28 }, card: { minHeight: 300, padding: 24 }, icon: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center" }, title: { marginTop: 20, fontSize: 23, fontWeight: "900", letterSpacing: -0.4 }, date: { marginTop: 7, fontSize: 12, lineHeight: 18 }, divider: { height: StyleSheet.hairlineWidth, marginVertical: 22 }, body: { fontSize: 15, lineHeight: 23 }, missing: { marginTop: 30, padding: 24, alignItems: "center" }, missingText: { fontSize: 13 } });
