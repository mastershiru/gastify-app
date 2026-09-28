import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const PIN_HASH_KEY = "gastify_pin_hash";
const PIN_SALT_KEY = "gastify_pin_salt";
const BIOMETRIC_KEY = "gastify_biometric_lock_enabled";

async function hash(pin: string, salt: string) {
    return Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${salt}:${pin}`,
    );
}

export async function createAppPin(pin: string) {
    const salt = Crypto.randomUUID();
    const pinHash = await hash(pin, salt);
    await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
    await SecureStore.setItemAsync(PIN_HASH_KEY, pinHash);
}

export async function verifyAppPin(pin: string) {
    const [salt, expected] = await Promise.all([
        SecureStore.getItemAsync(PIN_SALT_KEY),
        SecureStore.getItemAsync(PIN_HASH_KEY),
    ]);
    return Boolean(salt && expected && (await hash(pin, salt)) === expected);
}

export async function hasAppPin() {
    return Boolean(await SecureStore.getItemAsync(PIN_HASH_KEY));
}

export async function getBiometricsEnabled() {
    return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === "true";
}

export async function setBiometricsEnabled(enabled: boolean) {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, String(enabled));
}
