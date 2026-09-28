import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import {
    useColorScheme,
} from "react-native";

import FloatingTabBar from "@/components/navigation/FloatingTabBar";
import {
    GASTIFY_THEMES,
    type GastifyColorScheme,
} from "@/constants/theme";


export default function TabsLayout() {
    const colorScheme =
        useColorScheme();

    const scheme: GastifyColorScheme =
        colorScheme === "dark"
            ? "dark"
            : "light";

    const theme =
        GASTIFY_THEMES[scheme];


    return (
        <Tabs
            tabBar={(props) => (
                <FloatingTabBar {...props} />
            )}
            screenOptions={{
                headerShown: false,

                tabBarActiveTintColor:
                    theme.textPrimary,

                tabBarInactiveTintColor:
                    theme.textMuted,

                tabBarStyle: {
                    backgroundColor: "transparent",
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                },

                sceneStyle: {
                    backgroundColor: theme.background,
                },

                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",

                    tabBarIcon: ({
                        color,
                        size,
                        focused,
                    }) => (
                        <Ionicons
                            name={
                                focused
                                    ? "home"
                                    : "home-outline"
                            }
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="receipts"
                options={{
                    title: "Receipts",

                    tabBarIcon: ({
                        color,
                        size,
                        focused,
                    }) => (
                        <Ionicons
                            name={
                                focused
                                    ? "receipt"
                                    : "receipt-outline"
                            }
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="receipt-review"
                options={{
                    href: null,
                }}
            />

            <Tabs.Screen
                name="receipt-detail"
                options={{
                    href: null,
                }}
            />

            <Tabs.Screen
                name="notifications"
                options={{
                    title: "Notifications",
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "notifications" : "notifications-outline"}
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="notification-detail"
                options={{ href: null }}
            />
            <Tabs.Screen name="profile" options={{ title: "Profile" }} />

            <Tabs.Screen
                name="manual-expense"
                options={{
                    href: null,
                }}
            />

            <Tabs.Screen
                name="expenses"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
