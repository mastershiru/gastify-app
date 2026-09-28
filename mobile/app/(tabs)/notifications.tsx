import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, useColorScheme, View, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/ui";
import { GASTIFY_THEMES, type GastifyColorScheme } from "@/constants/theme";
import { getNotificationInbox, insertTestNotification, type GastifyNotification } from "@/services/notifications";

export default function NotificationsScreen() {
    const scheme: GastifyColorScheme = useColorScheme() === "dark" ? "dark" : "light";
    const theme = GASTIFY_THEMES[scheme];
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState<GastifyNotification[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const load = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true);
        try {
            await insertTestNotification();
            setNotifications(await getNotificationInbox());
        }
        finally { setRefreshing(false); }
    }, []);
    useEffect(() => { void load(); }, [load]);

    return <SafeAreaView edges={["top", "left", "right"]} style={[styles.safe, { backgroundColor: theme.background }]}><ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 112 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.textPrimary} />}><Text style={[styles.eyebrow, { color: theme.textMuted }]}>INBOX</Text><Text style={[styles.title, { color: theme.textPrimary }]}>Notifications</Text>{notifications.length ? notifications.map((notification) => <Pressable key={notification.id} onPress={() => router.push({ pathname: "/(tabs)/notification-detail", params: { id: notification.id } })} style={styles.pressable}><GlassCard contentStyle={styles.row} tintColor={theme.glassTint}><View style={[styles.icon, { backgroundColor: theme.brandSurface }]}><Ionicons color={theme.icon} name="notifications-outline" size={20} /></View><View style={styles.copy}><Text numberOfLines={1} style={[styles.rowTitle, { color: theme.textPrimary }]}>{notification.title}</Text><Text numberOfLines={2} style={[styles.rowBody, { color: theme.textSecondary }]}>{notification.body}</Text><Text style={[styles.date, { color: theme.textMuted }]}>{new Date(notification.receivedAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</Text></View><Ionicons color={theme.textMuted} name="chevron-forward" size={18} /></GlassCard></Pressable>) : <GlassCard contentStyle={styles.empty} tintColor={theme.glassTint}><Ionicons color={theme.textMuted} name="notifications-off-outline" size={30} /><Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No notifications yet</Text><Text style={[styles.emptyText, { color: theme.textSecondary }]}>Your monthly, yearly, and holiday notifications will appear here after they are delivered.</Text></GlassCard>}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, content: { paddingHorizontal: 20, paddingTop: 17 }, eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.6 }, title: { marginTop: 5, marginBottom: 23, fontSize: 29, fontWeight: "800", letterSpacing: -0.8 }, pressable: { marginBottom: 10, borderRadius: 21, overflow: "hidden" }, row: { minHeight: 86, padding: 15, flexDirection: "row", alignItems: "center", gap: 12 }, icon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center" }, copy: { flex: 1 }, rowTitle: { fontSize: 14, fontWeight: "800" }, rowBody: { marginTop: 3, fontSize: 12, lineHeight: 17 }, date: { marginTop: 6, fontSize: 10, fontWeight: "700" }, empty: { minHeight: 185, padding: 26, alignItems: "center", justifyContent: "center" }, emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: "800" }, emptyText: { marginTop: 6, fontSize: 12, lineHeight: 18, textAlign: "center" } });
