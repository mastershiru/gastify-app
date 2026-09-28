import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
    useState,
} from "react";
import {
    ActivityIndicator,
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
    loginUser,
} from "@/services/api";
import {
    useAuth,
} from "@/store/AuthProvider";


type FieldErrors = {
    email?: string;
    password?: string;
};


export default function LoginScreen() {
    const {
        signIn,
    } = useAuth();

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
        email,
        setEmail,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        showPassword,
        setShowPassword,
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


    const validateForm = () => {
        const errors: FieldErrors =
            {};

        const normalizedEmail =
            email
                .trim()
                .toLowerCase();

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
        }

        setFieldErrors(errors);

        return (
            Object.keys(errors)
                .length === 0
        );
    };


    const handleLogin = async () => {
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

        try {
            setIsSubmitting(true);

            const response =
                await loginUser({
                    email:
                        email
                            .trim()
                            .toLowerCase(),
                    password,
                });

            if (
                !response.access_token ||
                !response.refresh_token
            ) {
                throw new Error(
                    "Authentication tokens were not returned.",
                );
            }

            await signIn({
                accessToken:
                    response.access_token,
                refreshToken:
                    response.refresh_token,
            });

            await Haptics
                .notificationAsync(
                    Haptics
                        .NotificationFeedbackType
                        .Success,
                );

            router.replace(
                "/(onboarding)",
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
                    error.status === 401
                ) {
                    setFormError(
                        "Invalid email or password.",
                    );

                    return;
                }

                if (
                    error.status === 422
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
                "Unable to sign in. Please try again.",
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
                        title="Welcome back"
                        subtitle="Sign in to continue tracking your expenses, receipts, and savings."
                        theme={theme}
                        isDark={isDark}
                    />

                    <AuthCard
                        theme={theme}
                        isDark={isDark}
                    >
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

                                keyboardType:
                                    "email-address",

                                editable:
                                    !isSubmitting,

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
                                    "Enter your password",

                                autoCapitalize:
                                    "none",

                                autoComplete:
                                    "password",

                                editable:
                                    !isSubmitting,

                                maxLength:
                                    128,

                                secureTextEntry:
                                    !showPassword,

                                returnKeyType:
                                    "done",

                                onSubmitEditing:
                                    handleLogin,

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
                                        name="log-in-outline"
                                        size={20}
                                        color={
                                            theme.icon
                                        }
                                    />
                                )
                            }
                            label={
                                isSubmitting
                                    ? "Signing in..."
                                    : "Sign in"
                            }
                            onPress={
                                handleLogin
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
                            Don&apos;t have an
                            account?
                        </Text>

                        <Pressable
                            disabled={
                                isSubmitting
                            }
                            hitSlop={8}
                            onPress={() => {
                                router.replace(
                                    "/(auth)/register",
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
                                Create account
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
        justifyContent: "center",
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