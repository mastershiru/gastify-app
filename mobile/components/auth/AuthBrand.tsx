import { Ionicons } from "@expo/vector-icons";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import type {
    GastifyTheme,
} from "@/constants/theme";


type AuthBrandProps = {
    title: string;
    subtitle: string;
    theme: GastifyTheme;
    isDark: boolean;
};


export default function AuthBrand({
    title,
    subtitle,
    theme,
    isDark,
}: AuthBrandProps) {
    return (
        <View style={styles.hero}>
            <View
                style={[
                    styles.logo,
                    {
                        backgroundColor:
                            isDark
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(255,255,255,0.72)",

                        borderColor:
                            isDark
                                ? "rgba(255,255,255,0.12)"
                                : "rgba(255,255,255,0.95)",
                    },
                ]}
            >
                <Ionicons
                    name="wallet-outline"
                    size={30}
                    color={theme.icon}
                />
            </View>

            <Text
                style={[
                    styles.brand,
                    {
                        color:
                            theme.textPrimary,
                    },
                ]}
            >
                Gastify
            </Text>

            <Text
                style={[
                    styles.title,
                    {
                        color:
                            theme.textPrimary,
                    },
                ]}
            >
                {title}
            </Text>

            <Text
                style={[
                    styles.subtitle,
                    {
                        color:
                            theme.textSecondary,
                    },
                ]}
            >
                {subtitle}
            </Text>
        </View>
    );
}


const styles = StyleSheet.create({
    hero: {
        alignItems: "center",
        marginBottom: 26,
    },

    logo: {
        width: 64,
        height: 64,
        borderRadius: 22,

        alignItems: "center",
        justifyContent: "center",

        borderWidth:
            StyleSheet.hairlineWidth,

        marginBottom: 12,
    },

    brand: {
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
        marginBottom: 14,
    },

    title: {
        fontSize: 30,
        lineHeight: 36,
        fontWeight: "800",
        textAlign: "center",
        letterSpacing: -0.7,
    },

    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
        maxWidth: 330,
        marginTop: 8,
    },
});