import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
    useMemo,
    useState,
} from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import AuthBrand from "@/components/auth/AuthBrand";
import AuthCard from "@/components/auth/AuthCard";
import AuthField from "@/components/auth/AuthField";
import GlassButton from "@/components/ui/GlassButton";
import {
    GASTIFY_THEMES,
    type GastifyColorScheme,
} from "@/constants/theme";
import {
    ApiError,
    registerUser,
} from "@/services/api";


type FieldErrors = {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
};


export default function RegisterScreen() {
    const insets =
        useSafeAreaInsets();

    const systemColorScheme =
        useColorScheme();

    const colorScheme: GastifyColorScheme =
        systemColorScheme === "dark"
            ? "dark"
            : "light";

    const theme =
        GASTIFY_THEMES[colorScheme];

    const isDark =
        colorScheme === "dark";

    const [
        username,
        setUsername,
    ] = useState("");

    const [
        email,
        setEmail,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<FieldErrors>({});

    const [
        formError,
        setFormError,
    ] = useState<string | null>(
        null,
    );

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);


    const normalizedEmail =
        useMemo(
            () =>
                email
                    .trim()
                    .toLowerCase(),
            [email],
        );


    const validateForm =
        (): boolean => {
            const errors: FieldErrors =
                {};

            const trimmedUsername =
                username.trim();

            if (
                trimmedUsername.length >
                0 &&
                trimmedUsername.length <
                3
            ) {
                errors.username =
                    "Username must contain at least 3 characters.";
            }

            if (
                trimmedUsername.length >
                100
            ) {
                errors.username =
                    "Username cannot exceed 100 characters.";
            }

            if (!normalizedEmail) {
                errors.email =
                    "Email is required.";
            } else if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    normalizedEmail,
                )
            ) {
                errors.email =
                    "Enter a valid email address.";
            }

            if (!password) {
                errors.password =
                    "Password is required.";
            } else if (
                password.length < 8
            ) {
                errors.password =
                    "Password must contain at least 8 characters.";
            } else if (
                password.length > 128
            ) {
                errors.password =
                    "Password cannot exceed 128 characters.";
            }

            if (!confirmPassword) {
                errors.confirmPassword =
                    "Please confirm your password.";
            } else if (
                password !==
                confirmPassword
            ) {
                errors.confirmPassword =
                    "Passwords do not match.";
            }

            setFieldErrors(errors);

            return (
                Object.keys(errors)
                    .length === 0
            );
        };


    const handleRegister =
        async () => {
            if (isSubmitting) {
                return;
            }

            setFormError(null);

            if (!validateForm()) {
                await Haptics
                    .notificationAsync(
                        Haptics
                            .NotificationFeedbackType
                            .Error,
                    );

                return;
            }

            setIsSubmitting(true);

            try {
                const trimmedUsername =
                    username.trim();

                const response =
                    await registerUser({
                        email:
                            normalizedEmail,

                        username:
                            trimmedUsername
                                .length > 0
                                ? trimmedUsername
                                : undefined,

                        password,
                    });

                await Haptics
                    .notificationAsync(
                        Haptics
                            .NotificationFeedbackType
                            .Success,
                    );

                Alert.alert(
                    "Account created",
                    response.message,
                    [
                        {
                            text:
                                "Continue",

                            onPress: () => {
                                router.replace(
                                    "/(auth)/login",
                                );
                            },
                        },
                    ],
                );
            } catch (error) {
                await Haptics
                    .notificationAsync(
                        Haptics
                            .NotificationFeedbackType
                            .Error,
                    );

                if (
                    error instanceof ApiError
                ) {
                    if (
                        error.status ===
                        409
                    ) {
                        setFieldErrors(
                            (
                                current,
                            ) => ({
                                ...current,

                                email:
                                    "An account with this email already exists.",
                            }),
                        );

                        return;
                    }

                    if (
                        error.status ===
                        422
                    ) {
                        setFormError(
                            "Please review the information you entered.",
                        );

                        return;
                    }

                    setFormError(
                        error.message,
                    );

                    return;
                }

                setFormError(
                    "Unable to connect to Gastify. Please try again.",
                );
            } finally {
                setIsSubmitting(false);
            }
        };


    return (
        <SafeAreaView
            style={[
                styles.safeArea,
                {
                    backgroundColor:
                        theme.background,
                },
            ]}
            edges={[
                "top",
                "left",
                "right",
            ]}
        >
            <KeyboardAvoidingView
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
                style={
                    styles.keyboardView
                }
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingBottom:
                                Math.max(
                                    insets.bottom,
                                    24,
                                ) + 24,
                        },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={
                        false
                    }
                >
                    <AuthBrand
                        title="Create your account"
                        subtitle="Start tracking expenses, receipts, and savings in one place."
                        theme={theme}
                        isDark={isDark}
                    />

                    <AuthCard
                        theme={theme}
                        isDark={isDark}
                    >
                        <AuthField
                            label="Username"
                            icon="person-outline"
                            error={
                                fieldErrors.username
                            }
                            theme={theme}
                            isDark={isDark}
                            inputProps={{
                                value:
                                    username,

                                placeholder:
                                    "Optional username",

                                autoCapitalize:
                                    "none",

                                autoCorrect:
                                    false,

                                editable:
                                    !isSubmitting,

                                maxLength:
                                    100,

                                returnKeyType:
                                    "next",

                                onChangeText: (
                                    value,
                                ) => {
                                    setUsername(
                                        value,
                                    );

                                    if (
                                        fieldErrors.username
                                    ) {
                                        setFieldErrors(
                                            (
                                                current,
                                            ) => ({
                                                ...current,
                                                username:
                                                    undefined,
                                            }),
                                        );
                                    }
                                },
                            }}
                        />

                        <AuthField
                            label="Email"
                            icon="mail-outline"
                            error={
                                fieldErrors.email
                            }
                            theme={theme}
                            isDark={isDark}
                            inputProps={{
                                value:
                                    email,

                                placeholder:
                                    "you@example.com",

                                autoCapitalize:
                                    "none",

                                autoComplete:
                                    "email",

                                autoCorrect:
                                    false,

                                editable:
                                    !isSubmitting,

                                keyboardType:
                                    "email-address",

                                returnKeyType:
                                    "next",

                                onChangeText: (
                                    value,
                                ) => {
                                    setEmail(
                                        value,
                                    );

                                    if (
                                        fieldErrors.email
                                    ) {
                                        setFieldErrors(
                                            (
                                                current,
                                            ) => ({
                                                ...current,
                                                email:
                                                    undefined,
                                            }),
                                        );
                                    }
                                },
                            }}
                        />

                        <AuthField
                            label="Password"
                            icon="lock-closed-outline"
                            error={
                                fieldErrors.password
                            }
                            theme={theme}
                            isDark={isDark}
                            showPasswordToggle
                            passwordVisible={
                                showPassword
                            }
                            onTogglePassword={() => {
                                setShowPassword(
                                    (
                                        current,
                                    ) =>
                                        !current,
                                );
                            }}
                            inputProps={{
                                value:
                                    password,

                                placeholder:
                                    "At least 8 characters",

                                autoCapitalize:
                                    "none",

                                autoComplete:
                                    "new-password",

                                editable:
                                    !isSubmitting,

                                maxLength:
                                    128,

                                secureTextEntry:
                                    !showPassword,

                                returnKeyType:
                                    "next",

                                onChangeText: (
                                    value,
                                ) => {
                                    setPassword(
                                        value,
                                    );

                                    if (
                                        fieldErrors.password
                                    ) {
                                        setFieldErrors(
                                            (
                                                current,
                                            ) => ({
                                                ...current,
                                                password:
                                                    undefined,
                                            }),
                                        );
                                    }
                                },
                            }}
                        />

                        <AuthField
                            label="Confirm password"
                            icon="shield-checkmark-outline"
                            error={
                                fieldErrors
                                    .confirmPassword
                            }
                            theme={theme}
                            isDark={isDark}
                            showPasswordToggle
                            passwordVisible={
                                showConfirmPassword
                            }
                            onTogglePassword={() => {
                                setShowConfirmPassword(
                                    (
                                        current,
                                    ) =>
                                        !current,
                                );
                            }}
                            inputProps={{
                                value:
                                    confirmPassword,

                                placeholder:
                                    "Enter password again",

                                autoCapitalize:
                                    "none",

                                autoComplete:
                                    "new-password",

                                editable:
                                    !isSubmitting,

                                maxLength:
                                    128,

                                secureTextEntry:
                                    !showConfirmPassword,

                                returnKeyType:
                                    "done",

                                onSubmitEditing:
                                    handleRegister,

                                onChangeText: (
                                    value,
                                ) => {
                                    setConfirmPassword(
                                        value,
                                    );

                                    if (
                                        fieldErrors
                                            .confirmPassword
                                    ) {
                                        setFieldErrors(
                                            (
                                                current,
                                            ) => ({
                                                ...current,

                                                confirmPassword:
                                                    undefined,
                                            }),
                                        );
                                    }
                                },
                            }}
                        />

                        {formError ? (
                            <View
                                style={[
                                    styles.formError,
                                    {
                                        backgroundColor:
                                            isDark
                                                ? "rgba(127,29,29,0.28)"
                                                : "rgba(254,226,226,0.82)",
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="alert-circle-outline"
                                    size={20}
                                    color={
                                        isDark
                                            ? "#FCA5A5"
                                            : "#B91C1C"
                                    }
                                />

                                <Text
                                    style={[
                                        styles.formErrorText,
                                        {
                                            color:
                                                isDark
                                                    ? "#FECACA"
                                                    : "#991B1B",
                                        },
                                    ]}
                                >
                                    {formError}
                                </Text>
                            </View>
                        ) : null}

                        <GlassButton
                            disabled={
                                isSubmitting
                            }
                            haptics={
                                false
                            }
                            icon={
                                isSubmitting ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={
                                            theme.icon
                                        }
                                    />
                                ) : (
                                    <Ionicons
                                        name="arrow-forward"
                                        size={20}
                                        color={
                                            theme.icon
                                        }
                                    />
                                )
                            }
                            label={
                                isSubmitting
                                    ? "Creating account..."
                                    : "Create account"
                            }
                            onPress={
                                handleRegister
                            }
                            style={
                                styles.submitButton
                            }
                        />
                    </AuthCard>

                    <View
                        style={
                            styles.footerRow
                        }
                    >
                        <Text
                            style={[
                                styles.footerText,
                                {
                                    color:
                                        theme
                                            .textSecondary,
                                },
                            ]}
                        >
                            Already have an
                            account?
                        </Text>

                        <Pressable
                            disabled={
                                isSubmitting
                            }
                            hitSlop={8}
                            onPress={() => {
                                router.replace(
                                    "/(auth)/login",
                                );
                            }}
                        >
                            <Text
                                style={[
                                    styles.footerLink,
                                    {
                                        color:
                                            theme
                                                .textPrimary,
                                    },
                                ]}
                            >
                                Sign in
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },

    keyboardView: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 28,
    },

    formError: {
        borderRadius: 15,
        paddingHorizontal: 14,
        paddingVertical: 12,

        flexDirection: "row",
        alignItems: "flex-start",
        gap: 9,
    },

    formErrorText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },

    submitButton: {
        width: "100%",
        marginTop: 2,
    },

    footerRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",

        gap: 5,

        marginTop: 22,
    },

    footerText: {
        fontSize: 14,
    },

    footerLink: {
        fontSize: 14,
        fontWeight: "700",
    },
});