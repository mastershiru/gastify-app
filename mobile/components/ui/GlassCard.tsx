import { BlurView } from "expo-blur";
import {
    GlassView,
    isLiquidGlassAvailable,
} from "expo-glass-effect";
import type { PropsWithChildren } from "react";
import {
    Platform,
    StyleSheet,
    useColorScheme,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";

type GlassCardProps = PropsWithChildren<{
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    intensity?: number;
    fallback?: "blur" | "manual";
    tintColor?: string;
}>;

export default function GlassCard({
    children,
    style,
    contentStyle,
    intensity = 55,
    fallback = "blur",
    tintColor,
}: GlassCardProps) {
    const colorScheme =
        useColorScheme();

    const isDark =
        colorScheme === "dark";

    const canUseLiquidGlass =
        Platform.OS === "ios" &&
        isLiquidGlassAvailable();

    const liquidTint =
        tintColor ??
        (
            isDark
                ? "rgba(15,23,42,0.46)"
                : "rgba(255,255,255,0.48)"
        );

    if (canUseLiquidGlass) {
        return (
            <GlassView
                glassEffectStyle="regular"
                tintColor={liquidTint}
                style={[
                    styles.surface,
                    style,
                ]}
            >
                <View
                    pointerEvents="none"
                    style={[
                        styles.highlight,
                        {
                            borderColor:
                                isDark
                                    ? "rgba(255,255,255,0.10)"
                                    : "rgba(255,255,255,0.68)",
                        },
                    ]}
                />

                <View
                    style={[
                        styles.content,
                        contentStyle,
                    ]}
                >
                    {children}
                </View>
            </GlassView>
        );
    }

    if (fallback === "blur") {
        return (
            <BlurView
                intensity={intensity}
                tint={
                    isDark
                        ? "systemMaterialDark"
                        : "systemMaterialLight"
                }
                experimentalBlurMethod={
                    Platform.OS === "android"
                        ? "dimezisBlurView"
                        : "none"
                }
                style={[
                    styles.surface,
                    styles.fallbackBorder,
                    {
                        borderColor:
                            isDark
                                ? "rgba(255,255,255,0.12)"
                                : "rgba(255,255,255,0.76)",

                        backgroundColor:
                            isDark
                                ? "rgba(15,23,42,0.38)"
                                : "rgba(255,255,255,0.34)",
                    },
                    style,
                ]}
            >
                <View
                    pointerEvents="none"
                    style={[
                        styles.highlight,
                        {
                            borderColor:
                                isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(255,255,255,0.52)",
                        },
                    ]}
                />

                <View
                    style={[
                        styles.content,
                        contentStyle,
                    ]}
                >
                    {children}
                </View>
            </BlurView>
        );
    }

    return (
        <View
            style={[
                styles.surface,
                styles.fallbackBorder,
                {
                    borderColor:
                        isDark
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(255,255,255,0.82)",

                    backgroundColor:
                        isDark
                            ? "rgba(20,30,35,0.76)"
                            : "rgba(255,255,255,0.68)",
                },
                style,
            ]}
        >
            <View
                pointerEvents="none"
                style={[
                    styles.highlight,
                    {
                        borderColor:
                            isDark
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(255,255,255,0.48)",
                    },
                ]}
            />

            <View
                style={[
                    styles.content,
                    contentStyle,
                ]}
            >
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    surface: {
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
    },

    fallbackBorder: {
        borderWidth:
            StyleSheet.hairlineWidth,
    },

    highlight: {
        ...StyleSheet.absoluteFillObject,

        borderRadius: 24,

        borderWidth:
            StyleSheet.hairlineWidth,
    },

    content: {
        padding: 20,
    },
});