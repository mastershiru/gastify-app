import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
    GlassView,
    isLiquidGlassAvailable,
} from "expo-glass-effect";
import type { ReactNode } from "react";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useColorScheme,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";

type GlassButtonVariant =
    | "glass"
    | "primary";

type GlassButtonProps = {
    label: string;
    onPress: () => void;
    icon?: ReactNode;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    fallback?: "blur" | "manual";
    haptics?: boolean;
    variant?: GlassButtonVariant;
};

export default function GlassButton({
    label,
    onPress,
    icon,
    disabled = false,
    style,
    fallback = "blur",
    haptics = true,
    variant = "glass",
}: GlassButtonProps) {
    const colorScheme =
        useColorScheme();

    const isDark =
        colorScheme === "dark";

    const canUseLiquidGlass =
        Platform.OS === "ios" &&
        isLiquidGlassAvailable();

    const isPrimary =
        variant === "primary";

    const labelColor =
        isPrimary
            ? isDark
                ? "#07110E"
                : "#FFFFFF"
            : isDark
                ? "#F8FAFC"
                : "#0F172A";

    const primaryBackground =
        isDark
            ? "#F8FAFC"
            : "#0F172A";

    const liquidGlassTint =
        isDark
            ? "rgba(255,255,255,0.10)"
            : "rgba(255,255,255,0.46)";

    const handlePress =
        async () => {
            if (disabled) {
                return;
            }

            if (haptics) {
                try {
                    await Haptics
                        .impactAsync(
                            Haptics
                                .ImpactFeedbackStyle
                                .Light,
                        );
                } catch {
                    // Haptics are optional.
                }
            }

            onPress();
        };

    const content = (
        <View
            style={
                styles.content
            }
        >
            {icon}

            <Text
                numberOfLines={1}
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
        </View>
    );

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{
                disabled,
            }}
            disabled={disabled}
            onPress={() => {
                void handlePress();
            }}
            style={({
                pressed,
            }) => [
                    styles.pressable,
                    style,

                    pressed &&
                    !disabled &&
                    styles.pressed,

                    disabled &&
                    styles.disabled,
                ]}
        >
            {isPrimary ? (
                <View
                    style={[
                        styles.surface,
                        styles.primarySurface,
                        {
                            backgroundColor:
                                primaryBackground,
                        },
                    ]}
                >
                    {content}
                </View>
            ) : canUseLiquidGlass ? (
                <GlassView
                    glassEffectStyle="regular"
                    tintColor={
                        liquidGlassTint
                    }
                    isInteractive
                    style={
                        styles.surface
                    }
                >
                    <View
                        pointerEvents="none"
                        style={[
                            styles
                                .glassHighlight,
                            {
                                borderColor:
                                    isDark
                                        ? "rgba(255,255,255,0.12)"
                                        : "rgba(255,255,255,0.72)",
                            },
                        ]}
                    />

                    {content}
                </GlassView>
            ) : fallback ===
                "blur" ? (
                <BlurView
                    intensity={
                        isDark
                            ? 48
                            : 58
                    }
                    tint={
                        isDark
                            ? "systemMaterialDark"
                            : "systemMaterialLight"
                    }
                    experimentalBlurMethod={
                        Platform.OS ===
                            "android"
                            ? "dimezisBlurView"
                            : "none"
                    }
                    style={[
                        styles.surface,
                        styles
                            .fallbackSurface,
                        {
                            borderColor:
                                isDark
                                    ? "rgba(255,255,255,0.14)"
                                    : "rgba(255,255,255,0.82)",

                            backgroundColor:
                                isDark
                                    ? "rgba(255,255,255,0.07)"
                                    : "rgba(255,255,255,0.34)",
                        },
                    ]}
                >
                    {content}
                </BlurView>
            ) : (
                <View
                    style={[
                        styles.surface,
                        styles
                            .fallbackSurface,
                        {
                            borderColor:
                                isDark
                                    ? "rgba(255,255,255,0.14)"
                                    : "rgba(255,255,255,0.82)",

                            backgroundColor:
                                isDark
                                    ? "rgba(30,41,59,0.76)"
                                    : "rgba(255,255,255,0.68)",
                        },
                    ]}
                >
                    {content}
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        minWidth: 0,
        borderRadius: 18,
        overflow: "hidden",
    },

    surface: {
        minHeight: 52,
        borderRadius: 18,
        overflow: "hidden",
        justifyContent: "center",
    },

    primarySurface: {
        borderWidth:
            StyleSheet.hairlineWidth,

        borderColor:
            "rgba(255,255,255,0.16)",
    },

    fallbackSurface: {
        borderWidth:
            StyleSheet.hairlineWidth,
    },

    glassHighlight: {
        ...StyleSheet.absoluteFillObject,

        borderRadius: 18,

        borderWidth:
            StyleSheet.hairlineWidth,
    },

    content: {
        minHeight: 52,
        paddingHorizontal: 16,

        flexDirection: "row",

        alignItems: "center",

        justifyContent: "center",

        gap: 8,
    },

    label: {
        flexShrink: 1,

        fontSize: 14,

        fontWeight: "700",
    },

    pressed: {
        opacity: 0.82,

        transform: [
            {
                scale: 0.98,
            },
        ],
    },

    disabled: {
        opacity: 0.45,
    },
});