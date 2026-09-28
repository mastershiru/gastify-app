import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SCHEDULED_KEY = "gastify_scheduled_notifications_v1";
const INBOX_KEY = "gastify_notification_inbox_v1";

export type GastifyNotification = {
    id: string;
    title: string;
    body: string;
    receivedAt: string;
};

type PhilippineHoliday = {
    date: string;
    name: string;
};

// Nationwide dates announced in the Philippine holiday proclamations for 2026
// and 2027. Eid dates are intentionally omitted because they are proclaimed
// separately after lunar-calendar determination.
const PHILIPPINE_HOLIDAYS: PhilippineHoliday[] = [
    { date: "2026-12-08", name: "Feast of the Immaculate Conception" },
    { date: "2026-12-24", name: "Christmas Eve" },
    { date: "2026-12-25", name: "Christmas Day" },
    { date: "2026-12-30", name: "Rizal Day" },
    { date: "2026-12-31", name: "Last Day of the Year" },
    { date: "2027-01-01", name: "New Year’s Day" },
    { date: "2027-02-06", name: "Chinese New Year" },
    { date: "2027-02-25", name: "EDSA People Power Revolution Anniversary" },
    { date: "2027-03-25", name: "Maundy Thursday" },
    { date: "2027-03-26", name: "Good Friday" },
    { date: "2027-03-27", name: "Black Saturday" },
    { date: "2027-04-09", name: "Araw ng Kagitingan" },
    { date: "2027-05-01", name: "Labor Day" },
    { date: "2027-06-12", name: "Independence Day" },
    { date: "2027-08-21", name: "Ninoy Aquino Day" },
    { date: "2027-08-30", name: "National Heroes Day" },
    { date: "2027-11-01", name: "All Saints’ Day" },
    { date: "2027-11-02", name: "All Souls’ Day" },
    { date: "2027-11-30", name: "Bonifacio Day" },
    { date: "2027-12-08", name: "Feast of the Immaculate Conception" },
    { date: "2027-12-24", name: "Christmas Eve" },
    { date: "2027-12-25", name: "Christmas Day" },
    { date: "2027-12-30", name: "Rizal Day" },
    { date: "2027-12-31", name: "Last Day of the Year" },
];

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

function atTenAM(date: Date): Date {
    const result = new Date(date);
    result.setHours(10, 0, 0, 0);
    return result;
}

function monthEnd(year: number, month: number): Date {
    return new Date(year, month + 1, 0);
}

export async function enableExpenseNotifications(): Promise<boolean> {
    const existing = await Notifications.getPermissionsAsync();
    const permission = existing.granted
        ? existing
        : await Notifications.requestPermissionsAsync();

    if (!permission.granted) return false;

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("gastify-reminders", {
            name: "Gastify reminders",
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }

    return true;
}

export async function scheduleGastifyNotifications(): Promise<void> {
    if (await SecureStore.getItemAsync(SCHEDULED_KEY)) return;
    if (!await enableExpenseNotifications()) return;

    const now = new Date();
    const dates: Array<{ date: Date; title: string; body: string }> = [];

    for (let offset = 0; offset < 18; offset += 1) {
        const date = atTenAM(monthEnd(now.getFullYear(), now.getMonth() + offset));
        if (date > now) dates.push({ date, title: "Monthly expense summary", body: "Your Gastify monthly expenses are ready to review." });
    }

    for (const year of [now.getFullYear(), now.getFullYear() + 1]) {
        const date = atTenAM(new Date(year, 11, 31));
        if (date > now) dates.push({ date, title: "Yearly expense summary", body: "Your Gastify yearly expenses are ready to review." });
    }

    for (const holiday of PHILIPPINE_HOLIDAYS) {
        const date = atTenAM(new Date(`${holiday.date}T00:00:00`));
        if (date > now) dates.push({ date, title: `Philippine holiday: ${holiday.name}`, body: "Enjoy the holiday. Open Gastify to check your latest spending." });
    }

    const identifiers = await Promise.all(dates.map(({ date, title, body }) => Notifications.scheduleNotificationAsync({
        content: { title, body, data: { screen: "notifications" } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: "gastify-reminders" },
    })));
    await SecureStore.setItemAsync(SCHEDULED_KEY, JSON.stringify(identifiers));
}

export async function saveReceivedNotification(
    notification: Notifications.Notification,
): Promise<void> {
    const item: GastifyNotification = {
        id: notification.request.identifier,
        title: notification.request.content.title ?? "Gastify update",
        body: notification.request.content.body ?? "You have a new Gastify notification.",
        receivedAt: new Date(notification.date).toISOString(),
    };
    const current = await getNotificationInbox();
    const withoutDuplicate = current.filter((existing) => existing.id !== item.id);
    await SecureStore.setItemAsync(INBOX_KEY, JSON.stringify([item, ...withoutDuplicate].slice(0, 50)));
}

export async function getNotificationInbox(): Promise<GastifyNotification[]> {
    const raw = await SecureStore.getItemAsync(INBOX_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw) as GastifyNotification[];
    } catch {
        return [];
    }
}

export async function getNotificationById(id: string): Promise<GastifyNotification | null> {
    return (await getNotificationInbox()).find((notification) => notification.id === id) ?? null;
}

export async function insertTestNotification(): Promise<void> {
    const current = await getNotificationInbox();
    const id = "gastify-test-notification";
    if (current.some((notification) => notification.id === id)) return;

    await SecureStore.setItemAsync(INBOX_KEY, JSON.stringify([
        {
            id,
            title: "Test notification",
            body: "This is an example Gastify notification. Tap it to view the full notification details.",
            receivedAt: new Date().toISOString(),
        },
        ...current,
    ]));
}
