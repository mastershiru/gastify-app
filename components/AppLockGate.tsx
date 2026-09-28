import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { GASTIFY_THEMES } from "@/constants/theme";
import { getBiometricsEnabled, hasAppPin, verifyAppPin } from "@/services/appLock";

export default function AppLockGate({ children, active }: { children: React.ReactNode; active: boolean }) {
    const [locked, setLocked] = useState(false);
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    useEffect(() => { void (async () => { setBiometricEnabled(await getBiometricsEnabled()); if (active && await hasAppPin()) setLocked(true); })(); }, [active]);
    useEffect(() => {
        const subscription = AppState.addEventListener("change", async (state) => { if (state === "active" && active && await hasAppPin()) setLocked(true); });
        return () => subscription.remove();
    }, [active]);
    const unlock = async () => { if (await verifyAppPin(pin)) { setPin(""); setError(""); setLocked(false); } else { setError("Incorrect PIN."); setPin(""); } };
    const biometricUnlock = async () => { const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Gastify" }); if (result.success) setLocked(false); };
    if (!locked) return <>{children}</>;
    const theme = GASTIFY_THEMES.dark;
    return <View style={[styles.container, { backgroundColor: theme.background }]}><Text style={styles.brand}>Gastify</Text><Text style={styles.title}>Unlock app</Text><Text style={styles.subtitle}>Enter your PIN to continue.</Text><TextInput autoFocus keyboardType="number-pad" maxLength={6} onChangeText={setPin} onSubmitEditing={() => void unlock()} placeholder="PIN" placeholderTextColor={theme.textMuted} secureTextEntry style={[styles.input, { borderColor: theme.glassBorder, color: theme.textPrimary }]} value={pin} /><Text style={styles.error}>{error}</Text><Pressable onPress={() => void unlock()} style={styles.unlock}><Text style={styles.unlockText}>Unlock</Text></Pressable>{biometricEnabled ? <Pressable onPress={() => void biometricUnlock()}><Text style={styles.biometric}>Use Face ID / Fingerprint</Text></Pressable> : null}</View>;
}
const styles = StyleSheet.create({ container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 }, brand: { color: "#94A3B8", fontSize: 14, fontWeight: "800", letterSpacing: 1.3 }, title: { color: "#F8FAFC", marginTop: 12, fontSize: 29, fontWeight: "800" }, subtitle: { color: "#CBD5E1", marginTop: 7, fontSize: 14 }, input: { width: "100%", maxWidth: 300, minHeight: 56, marginTop: 30, borderWidth: 1, borderRadius: 18, paddingHorizontal: 18, fontSize: 20, textAlign: "center", letterSpacing: 8 }, error: { minHeight: 20, marginTop: 8, color: "#FCA5A5", fontSize: 13 }, unlock: { width: "100%", maxWidth: 300, minHeight: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" }, unlockText: { color: "#07110E", fontSize: 15, fontWeight: "800" }, biometric: { marginTop: 22, color: "#F8FAFC", fontSize: 13, fontWeight: "700" } });
