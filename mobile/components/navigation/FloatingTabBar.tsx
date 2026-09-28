import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSegments } from "expo-router";
import { MotiView } from "moti";
import {
    Pressable,
    StyleSheet,
    useColorScheme,
    View,
} from "react-native";

import GlassCard from "@/components/ui/GlassCard";
import {
    GASTIFY_THEMES,
    type GastifyColorScheme,
} from "@/constants/theme";


const TAB_ICONS: Record<
    string,
    {
        active: keyof typeof Ionicons.glyphMap;
        inactive: keyof typeof Ionicons.glyphMap;
    }
> = {
    index: {
        active: "home",
        inactive: "home-outline",
    },
    receipts: {
        active: "receipt",
        inactive: "receipt-outline",
    },
    notifications: {
        active: "notifications",
        inactive: "notifications-outline",
    },
    profile: {
        active: "person",
        inactive: "person-outline",
    },
};

const PRIMARY_TAB_NAMES = new Set([
    "index",
    "receipts",
    "notifications",
    "profile",
]);


export default function FloatingTabBar({
    state,
    descriptors,
    navigation,
    insets,
}: BottomTabBarProps) {
    const segments = useSegments();
    const colorScheme = useColorScheme();
    const scheme: GastifyColorScheme =
        colorScheme === "dark" ? "dark" : "light";
    const theme = GASTIFY_THEMES[scheme];

    const activeRoute =
        state.routes[state.index];

    const currentPath =
        segments.join("/");

    const isNestedReceiptFlow =
        currentPath.includes("receipt-review") ||
        currentPath.includes("receipt-detail");

    if (
        isNestedReceiptFlow ||
        !PRIMARY_TAB_NAMES.has(activeRoute.name)
    ) {
        return null;
    }

    const visibleRoutes = state.routes.filter(
        (route) => PRIMARY_TAB_NAMES.has(route.name),
    );

    return (
        <View
            pointerEvents="box-none"
            style={[
                styles.outer,
                {
                    paddingBottom: Math.max(insets.bottom, 12),
                },
            ]}
        >
            <GlassCard
                contentStyle={styles.dockContent}
                intensity={72}
                style={styles.dock}
                tintColor={theme.glassTint}
            >
                {visibleRoutes.map((route) => {
                    const routeIndex = state.routes.findIndex(
                        (item) => item.key === route.key,
                    );
                    const isFocused = state.index === routeIndex;
                    const options = descriptors[route.key].options;
                    const icon = TAB_ICONS[route.name] ?? TAB_ICONS.index;
                    const color = isFocused
                        ? theme.textPrimary
                        : theme.textMuted;
                    const label =
                        typeof options.tabBarLabel === "string"
                            ? options.tabBarLabel
                            : options.title ?? route.name;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: "tabPress",
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <Pressable
                            key={route.key}
                            accessibilityLabel={
                                options.tabBarAccessibilityLabel ?? label
                            }
                            accessibilityRole="button"
                            accessibilityState={{ selected: isFocused }}
                            onLongPress={() =>
                                navigation.emit({
                                    type: "tabLongPress",
                                    target: route.key,
                                })
                            }
                            onPress={onPress}
                            style={styles.tabButton}
                        >
                            <MotiView
                                animate={{
                                    opacity: isFocused ? 1 : 0,
                                    scale: isFocused ? 1 : 0.86,
                                }}
                                pointerEvents="none"
                                transition={{
                                    type: "spring",
                                    damping: 16,
                                    stiffness: 220,
                                }}
                                style={[
                                    styles.activeCapsule,
                                    {
                                        backgroundColor:
                                            scheme === "dark"
                                                ? "rgba(255,255,255,0.14)"
                                                : "rgba(15,23,42,0.07)",
                                    },
                                ]}
                            />

                            <MotiView
                                animate={{
                                    scale: isFocused ? 1.06 : 1,
                                }}
                                transition={{
                                    type: "spring",
                                    damping: 14,
                                    stiffness: 260,
                                }}
                            >
                                <Ionicons
                                    color={color}
                                    name={
                                        isFocused
                                            ? icon.active
                                            : icon.inactive
                                    }
                                    size={25}
                                />
                            </MotiView>
                        </Pressable>
                    );
                })}
            </GlassCard>
        </View>
    );
}


const styles = StyleSheet.create({
    outer: {
        position: "absolute",
        right: 0,
        bottom: 0,
        left: 0,
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 8,
    },

    dock: {
        width: "100%",
        maxWidth: 460,
        borderRadius: 32,
        shadowColor: "#020617",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 12,
    },

    dockContent: {
        minHeight: 66,
        paddingHorizontal: 8,
        paddingVertical: 7,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
    },

    tabButton: {
        flex: 1,
        minHeight: 52,
        alignItems: "center",
        justifyContent: "center",
    },

    activeCapsule: {
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius: 24,
    },
});
