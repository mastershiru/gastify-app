import type {
    PropsWithChildren,
} from "react";
import {
    StyleSheet,
} from "react-native";

import GlassCard from "@/components/ui/GlassCard";
import type {
    GastifyTheme,
} from "@/constants/theme";


type AuthCardProps =
    PropsWithChildren<{
        theme: GastifyTheme;
        isDark: boolean;
    }>;


export default function AuthCard({
    children,
    theme,
    isDark,
}: AuthCardProps) {
    return (
        <GlassCard
            tintColor={
                theme.glassTint
            }
            intensity={
                isDark
                    ? 45
                    : 65
            }
            style={
                styles.card
            }
            contentStyle={
                styles.content
            }
        >
            {children}
        </GlassCard>
    );
}


const styles = StyleSheet.create({
    card: {
        width: "100%",
        borderRadius: 28,
    },

    content: {
        padding: 20,
        gap: 18,
    },
});