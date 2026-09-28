import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, useColorScheme, View } from "react-native";

import GlassCard from "@/components/ui/GlassCard";
import { GASTIFY_THEMES, type GastifyColorScheme } from "@/constants/theme";
import { authenticatedFetch, type ApiUser } from "@/services/api";
import { getBiometricsEnabled, hasAppPin, verifyAppPin } from "@/services/appLock";

type AppLockGateProps = { children: React.ReactNode; active: boolean };
const PIN_LENGTH = 6;

export default function AppLockGate({ children, active }: AppLockGateProps) {
    const scheme: GastifyColorScheme = useColorScheme() === "dark" ? "dark" : "light";
    const theme = GASTIFY_THEMES[scheme];
    const [isReady, setIsReady] = useState(false);
    const [locked, setLocked] = useState(false);
    const [pin, setPin] = useState("");
    const [biometrics, setBiometrics] = useState(false);
    const [usePinLogin, setUsePinLogin] = useState(false);
    const [username, setUsername] = useState("Gastify user");
    const wasBackgrounded = useRef(false);

    useEffect(() => {
        let current = true;
        setIsReady(false);
        void (async () => {
            const pinExists = active && await hasAppPin();
            const biometricsEnabled = pinExists && await getBiometricsEnabled();
            if (!current) return;
            setBiometrics(biometricsEnabled);
            setUsePinLogin(false);
            setLocked(pinExists);
            setIsReady(true);
        })();
        return () => { current = false; };
    }, [active]);

    useEffect(() => {
        if (!active) return;
        void (async () => {
            try {
                const response = await authenticatedFetch("/api/v1/auth/me");
                if (!response.ok) return;
                const user = await response.json() as ApiUser;
                setUsername(user.username?.trim() || user.email);
            } catch { /* A name is decorative; unlocking must remain local/offline. */ }
        })();
    }, [active]);

    useEffect(() => {
        const listener = AppState.addEventListener("change", async (state) => {
            const returningFromBackground = state === "active" && wasBackgrounded.current;
            if (state === "background") wasBackgrounded.current = true;

            if (returningFromBackground && active && await hasAppPin()) {
                wasBackgrounded.current = false;
                setPin("");
                setUsePinLogin(false);
                setLocked(true);
            }
        });
        return () => listener.remove();
    }, [active]);

    const submitPin = async (value: string) => {
        if (value.length < 4) return;
        if (await verifyAppPin(value)) { setPin(""); setLocked(false); return; }
        setPin("");
    };
    const unlockWithBiometrics = async () => {
        if ((await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Gastify" })).success) setLocked(false);
    };

    if (!isReady) return <View style={[styles.loadingPage, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.textPrimary} size="large" /></View>;
    if (!locked) return <>{children}</>;

    return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.page, { backgroundColor: theme.background }]}><TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}><View style={styles.touchArea}><View style={[styles.glowOne, { backgroundColor: scheme === "dark" ? "rgba(59,130,246,0.18)" : "rgba(59,130,246,0.16)" }]} /><View style={[styles.glowTwo, { backgroundColor: scheme === "dark" ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.13)" }]} /><View style={styles.content}><Text style={[styles.brand, { color: theme.textMuted }]}>GASTIFY</Text><GlassCard contentStyle={styles.identityCard} style={styles.identity} tintColor={theme.glassTint}><Ionicons color={theme.icon} name="person-circle-outline" size={25} /><Text numberOfLines={1} style={[styles.username, { color: theme.textPrimary }]}>{username}</Text></GlassCard><Text style={[styles.title, { color: theme.textPrimary }]}>Welcome back</Text>{usePinLogin ? <><Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter your PIN to continue</Text><GlassCard contentStyle={styles.pinInputCard} style={styles.pinInputShell} tintColor={theme.glassTint}><TextInput autoFocus keyboardType="number-pad" maxLength={PIN_LENGTH} onChangeText={setPin} onSubmitEditing={() => void submitPin(pin)} placeholder="PIN" placeholderTextColor={theme.textMuted} secureTextEntry style={[styles.pinInput, { color: theme.textPrimary }]} value={pin} /></GlassCard><Pressable disabled={pin.length < 4} onPress={() => { Keyboard.dismiss(); void submitPin(pin); }} style={[styles.unlockButton, pin.length < 4 && styles.keyDisabled]}><GlassCard contentStyle={[styles.unlockContent, { backgroundColor: theme.brandSurface }]} tintColor={theme.glassTint}><Text style={[styles.unlockText, { color: theme.textPrimary }]}>Unlock</Text><Ionicons color={theme.icon} name="arrow-forward" size={18} /></GlassCard></Pressable></> : <Pressable onPress={() => setUsePinLogin(true)} style={styles.mpinButton}><GlassCard contentStyle={styles.mpinContent} style={styles.mpinGlass} tintColor={theme.glassTint}><Ionicons color={theme.icon} name="keypad-outline" size={34} /><Text style={[styles.mpinText, { color: theme.textPrimary }]}>MPIN{`\n`}Login</Text></GlassCard></Pressable>}{biometrics ? <Pressable accessibilityLabel="Unlock with Face ID or fingerprint" accessibilityRole="button" onPress={() => { Keyboard.dismiss(); void unlockWithBiometrics(); }} style={styles.bioButton}><GlassCard contentStyle={styles.bioContent} style={styles.bioGlass} tintColor={theme.glassTint}><Ionicons color={theme.icon} name="finger-print-outline" size={28} /></GlassCard></Pressable> : null}</View></View></TouchableWithoutFeedback></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ loadingPage: { flex: 1, alignItems: "center", justifyContent: "center" }, page: { flex: 1, overflow: "hidden" }, touchArea: { flex: 1 }, glowOne: { position: "absolute", top: -120, right: -100, width: 310, height: 310, borderRadius: 155 }, glowTwo: { position: "absolute", bottom: -110, left: -100, width: 260, height: 260, borderRadius: 130 }, content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingVertical: 34 }, brand: { fontSize: 12, fontWeight: "800", letterSpacing: 2 }, identity: { width: "100%", maxWidth: 310, marginTop: 21 }, identityCard: { minHeight: 54, paddingVertical: 12, paddingHorizontal: 17, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" }, username: { maxWidth: 230, fontSize: 16, fontWeight: "800" }, title: { marginTop: 25, fontSize: 27, fontWeight: "800" }, subtitle: { marginTop: 12, fontSize: 13 }, mpinButton: { width: 116, height: 116, marginTop: 25, borderRadius: 58, overflow: "hidden" }, mpinGlass: { flex: 1, borderRadius: 58 }, mpinContent: { flex: 1, padding: 12, alignItems: "center", justifyContent: "center", gap: 5 }, mpinText: { fontSize: 12, fontWeight: "800", textAlign: "center", lineHeight: 15 }, pinInputShell: { width: "100%", maxWidth: 310, marginTop: 18 }, pinInputCard: { paddingVertical: 0, paddingHorizontal: 16 }, pinInput: { minHeight: 53, fontSize: 17, fontWeight: "700", textAlign: "center", letterSpacing: 5 }, keyDisabled: { opacity: 0.36 }, unlockButton: { width: "100%", maxWidth: 310, marginTop: 12, borderRadius: 18, overflow: "hidden" }, unlockContent: { minHeight: 49, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, unlockText: { fontSize: 14, fontWeight: "800" }, bioButton: { width: 60, height: 60, marginTop: 18, borderRadius: 30, overflow: "hidden" }, bioGlass: { flex: 1, borderRadius: 30 }, bioContent: { flex: 1, padding: 0, alignItems: "center", justifyContent: "center" } });
