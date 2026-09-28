import { Ionicons } from "@expo/vector-icons";
import type {
    ComponentProps,
} from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    type TextInputProps,
} from "react-native";

import type {
    GastifyTheme,
} from "@/constants/theme";


type IoniconName =
    ComponentProps<
        typeof Ionicons
    >["name"];


type AuthFieldProps = {
    label: string;
    icon: IoniconName;
    error?: string;

    theme: GastifyTheme;
    isDark: boolean;

    showPasswordToggle?: boolean;
    passwordVisible?: boolean;
    onTogglePassword?: () => void;

    inputProps: TextInputProps;
};


export default function AuthField({
    label,
    icon,
    error,
    theme,
    isDark,
    showPasswordToggle = false,
    passwordVisible = false,
    onTogglePassword,
    inputProps,
}: AuthFieldProps) {
    const iconColor =
        isDark
            ? "#94A3B8"
            : "#64748B";

    const placeholderColor =
        isDark
            ? "#64748B"
            : "#94A3B8";

    const labelColor =
        isDark
            ? "#CBD5E1"
            : "#334155";

    const inputBackground =
        isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(255,255,255,0.58)";

    const inputBorder =
        isDark
            ? "rgba(255,255,255,0.12)"
            : "rgba(148,163,184,0.32)";

    const errorColor =
        isDark
            ? "#FCA5A5"
            : "#B91C1C";

    const errorBorder =
        isDark
            ? "#F87171"
            : "#DC2626";


    return (
        <View style={styles.field}>
            <Text
                style={[
                    styles.label,
                    {
                        color:
                            labelColor,
                    },
                ]}
            >
                {label}
            </Text>

            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor:
                            inputBackground,

                        borderColor:
                            error
                                ? errorBorder
                                : inputBorder,
                    },
                ]}
            >
                <Ionicons
                    name={icon}
                    size={20}
                    color={iconColor}
                />

                <TextInput
                    {...inputProps}
                    placeholderTextColor={
                        inputProps
                            .placeholderTextColor ??
                        placeholderColor
                    }
                    selectionColor={
                        inputProps
                            .selectionColor ??
                        theme.textPrimary
                    }
                    style={[
                        styles.input,
                        {
                            color:
                                theme.textPrimary,
                        },
                        inputProps.style,
                    ]}
                />

                {showPasswordToggle ? (
                    <Pressable
                        accessibilityLabel={
                            passwordVisible
                                ? "Hide password"
                                : "Show password"
                        }
                        disabled={
                            inputProps.editable ===
                            false
                        }
                        hitSlop={8}
                        onPress={
                            onTogglePassword
                        }
                        style={
                            styles.eyeButton
                        }
                    >
                        <Ionicons
                            name={
                                passwordVisible
                                    ? "eye-off-outline"
                                    : "eye-outline"
                            }
                            size={21}
                            color={
                                iconColor
                            }
                        />
                    </Pressable>
                ) : null}
            </View>

            {error ? (
                <Text
                    style={[
                        styles.errorText,
                        {
                            color:
                                errorColor,
                        },
                    ]}
                >
                    {error}
                </Text>
            ) : null}
        </View>
    );
}


const styles = StyleSheet.create({
    field: {
        gap: 7,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
    },

    inputContainer: {
        minHeight: 56,
        borderRadius: 18,

        paddingHorizontal: 15,

        flexDirection: "row",
        alignItems: "center",
        gap: 10,

        borderWidth:
            StyleSheet.hairlineWidth,
    },

    input: {
        flex: 1,
        minHeight: 54,

        fontSize: 16,
        paddingVertical: 0,
    },

    eyeButton: {
        width: 38,
        height: 44,

        alignItems: "center",
        justifyContent: "center",
    },

    errorText: {
        fontSize: 12,
        lineHeight: 17,
    },
});