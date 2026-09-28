import type { AnimationObject } from "lottie-react-native";

export type OnboardingSlide = {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    animation: AnimationObject;
    icon:
    | "receipt-outline"
    | "stats-chart-outline"
    | "wallet-outline"
    | "shield-checkmark-outline";
};

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
    {
        id: "receipt-scan",
        eyebrow: "SMART RECEIPT TRACKING",
        title: "Snap your receipt. We'll handle the rest.",
        description:
            "Scan or upload a receipt and Gastify automatically reads and calculates your expenses.",
        animation: require("@/assets/animations/receipt-scan.json"),
        icon: "receipt-outline",
    },
    {
        id: "expense-insights",
        eyebrow: "CLEAR SPENDING INSIGHTS",
        title: "See where your money goes.",
        description:
            "Understand your spending at a glance with clear monthly and yearly expense totals.",
        animation: require("@/assets/animations/expense-insights.json"),
        icon: "stats-chart-outline",
    },
    {
        id: "savings",
        eyebrow: "SAVINGS MADE SIMPLE",
        title: "Keep your savings separate.",
        description:
            "Track your savings independently from everyday spending and see your progress clearly.",
        animation: require("@/assets/animations/savings.json"),
        icon: "wallet-outline",
    },
    {
        id: "security",
        eyebrow: "PRIVATE & SECURE",
        title: "Your money. Your data. Protected.",
        description:
            "Keep your financial information private with Face ID or biometric app lock.",
        animation: require("@/assets/animations/security.json"),
        icon: "shield-checkmark-outline",
    },
];