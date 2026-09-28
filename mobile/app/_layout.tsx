import "../global.css";

import {
  Stack,
  useRouter,
  useSegments,
} from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import {
  useEffect,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import "react-native-reanimated";

import {
  AuthProvider,
  useAuth,
} from "@/store/AuthProvider";
import {
  ReceiptDraftProvider,
} from "@/store/ReceiptDraftProvider";
import {
  scheduleGastifyNotifications,
  saveReceivedNotification,
} from "@/services/notifications";
import AppLockGate from "../components/AppLockGate";


function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();

  const {
    isAuthenticated,
    isLoading,
  } = useAuth();


  useEffect(() => {
    if (isLoading) {
      return;
    }

    const currentGroup = segments[0];

    const isInAuth =
      currentGroup === "(auth)";

    const isInOnboarding =
      currentGroup === "(onboarding)";

    const isInTabs =
      currentGroup === "(tabs)";


    if (isAuthenticated) {
      if (!isInTabs) {
        router.replace("/(tabs)");
      }

      return;
    }


    if (!isInAuth && !isInOnboarding) {
      router.replace("/(onboarding)");
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
    segments,
  ]);

  useEffect(() => {
    if (isAuthenticated) {
      void scheduleGastifyNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) void saveReceivedNotification(response.notification);
    });

    const received = Notifications.addNotificationReceivedListener((notification) => {
      void saveReceivedNotification(notification);
    });
    const responded = Notifications.addNotificationResponseReceivedListener((response) => {
      void saveReceivedNotification(response.notification);
    });

    return () => {
      received.remove();
      responded.remove();
    };
  }, [isAuthenticated]);


  if (isLoading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#0F172A"
        />
      </View>
    );
  }


  return (
    <>
      <AppLockGate active={isAuthenticated}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="(onboarding)"
        />

        <Stack.Screen
          name="(auth)"
        />

        <Stack.Screen
          name="(tabs)"
        />
      </Stack>

      <StatusBar style="auto" />
      </AppLockGate>
    </>
  );
}


export default function RootLayout() {
  return (
    <GestureHandlerRootView
      style={styles.flex}
    >
      <AuthProvider>
        <ReceiptDraftProvider>
          <RootNavigator />
        </ReceiptDraftProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}


const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4F2",
  },
});
