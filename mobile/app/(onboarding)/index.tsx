import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import {
    useCallback,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";
import {
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
    SafeAreaView,
} from "react-native-safe-area-context";
import {
    Carousel,
    type CarouselRef,
    type CarouselRenderItemInfo,
} from "react-native-reanimated-carousel";

import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import {
    ONBOARDING_SLIDES,
    type OnboardingSlide,
} from "@/constants/onboarding";
import {
    GASTIFY_THEMES,
    type GastifyColorScheme,
} from "@/constants/theme";


const { width: SCREEN_WIDTH } =
    Dimensions.get("window");

const CAROUSEL_HEIGHT = 480;

const CARD_HORIZONTAL_MARGIN = 24;

const CARD_WIDTH =
    SCREEN_WIDTH -
    CARD_HORIZONTAL_MARGIN * 2;


export default function OnboardingScreen() {
    const systemColorScheme =
        useColorScheme();

    const colorScheme: GastifyColorScheme =
        systemColorScheme === "dark"
            ? "dark"
            : "light";

    const theme =
        GASTIFY_THEMES[colorScheme];

    const isDark =
        colorScheme === "dark";

    const carouselRef =
        useRef<CarouselRef>(null);

    const [
        activeIndex,
        setActiveIndex,
    ] = useState(0);


    const isLastSlide =
        activeIndex ===
        ONBOARDING_SLIDES.length - 1;


    const dynamicStyles =
        useMemo(
            () =>
                StyleSheet.create({
                    safeArea: {
                        backgroundColor:
                            theme.background,
                    },

                    brandIcon: {
                        backgroundColor:
                            theme.brandSurface,
                        borderColor:
                            theme.brandBorder,
                    },

                    brand: {
                        color:
                            theme.textPrimary,
                    },

                    skipText: {
                        color:
                            theme.textMuted,
                    },

                    visualGlow: {
                        backgroundColor:
                            theme.glassGlow,
                    },

                    eyebrow: {
                        color:
                            theme.textSecondary,
                    },

                    title: {
                        color:
                            theme.textPrimary,
                    },

                    description: {
                        color:
                            theme.textSecondary,
                    },

                    dot: {
                        backgroundColor:
                            theme.paginationInactive,
                    },

                    activeDot: {
                        backgroundColor:
                            theme.paginationActive,
                    },

                    signInPrefix: {
                        color:
                            theme.textMuted,
                    },

                    signInText: {
                        color:
                            theme.textPrimary,
                    },
                }),
            [theme],
        );


    const handleCreateAccount =
        useCallback(() => {
            router.push(
                "/(auth)/register",
            );
        }, []);


    const handleSignIn =
        useCallback(() => {
            router.push(
                "/(auth)/login",
            );
        }, []);


    const handleSkip =
        useCallback(async () => {
            await Haptics.impactAsync(
                Haptics
                    .ImpactFeedbackStyle
                    .Light,
            );

            carouselRef.current?.scrollTo({
                index:
                    ONBOARDING_SLIDES.length -
                    1,
                animated: true,
            });
        }, []);


    const handleNext =
        useCallback(async () => {
            await Haptics.impactAsync(
                Haptics
                    .ImpactFeedbackStyle
                    .Light,
            );

            if (isLastSlide) {
                handleCreateAccount();
                return;
            }

            carouselRef.current?.next({
                animated: true,
            });
        }, [
            handleCreateAccount,
            isLastSlide,
        ]);


    const renderSlide =
        useCallback(
            ({
                item,
            }: CarouselRenderItemInfo<OnboardingSlide>) => {
                return (
                    <View
                        style={
                            styles.slide
                        }
                    >
                        <GlassCard
                            tintColor={
                                theme.glassTint
                            }
                            intensity={
                                isDark
                                    ? 40
                                    : 50
                            }
                            style={
                                styles.card
                            }
                            contentStyle={
                                styles.cardContent
                            }
                        >
                            <View
                                style={
                                    styles.visualArea
                                }
                            >
                                <View
                                    style={[
                                        styles.visualGlow,
                                        dynamicStyles.visualGlow,
                                    ]}
                                />

                                <View
                                    style={
                                        styles.animationContainer
                                    }
                                >
                                    <LottieView
                                        source={
                                            item.animation
                                        }
                                        autoPlay
                                        loop
                                        resizeMode="contain"
                                        style={
                                            styles.animation
                                        }
                                    />
                                </View>
                            </View>

                            <View
                                style={
                                    styles.copyContainer
                                }
                            >
                                <Text
                                    style={[
                                        styles.eyebrow,
                                        dynamicStyles.eyebrow,
                                    ]}
                                >
                                    {
                                        item.eyebrow
                                    }
                                </Text>

                                <Text
                                    style={[
                                        styles.title,
                                        dynamicStyles.title,
                                    ]}
                                >
                                    {
                                        item.title
                                    }
                                </Text>

                                <Text
                                    style={[
                                        styles.description,
                                        dynamicStyles.description,
                                    ]}
                                >
                                    {
                                        item.description
                                    }
                                </Text>
                            </View>
                        </GlassCard>
                    </View>
                );
            },
            [
                dynamicStyles,
                isDark,
                theme.glassTint,
            ],
        );


    return (
        <GestureHandlerRootView
            style={styles.root}
        >
            <SafeAreaView
                style={[
                    styles.safeArea,
                    dynamicStyles.safeArea,
                ]}
                edges={[
                    "top",
                    "bottom",
                ]}
            >
                <View
                    style={
                        styles.container
                    }
                >
                    <View
                        style={
                            styles.header
                        }
                    >
                        <View
                            style={
                                styles.brandContainer
                            }
                        >
                            <View
                                style={[
                                    styles.brandIcon,
                                    dynamicStyles.brandIcon,
                                ]}
                            >
                                <Ionicons
                                    name="wallet-outline"
                                    size={21}
                                    color={
                                        theme.icon
                                    }
                                />
                            </View>

                            <Text
                                style={[
                                    styles.brand,
                                    dynamicStyles.brand,
                                ]}
                            >
                                Gastify
                            </Text>
                        </View>

                        {!isLastSlide ? (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Skip onboarding"
                                hitSlop={12}
                                onPress={
                                    handleSkip
                                }
                                style={({
                                    pressed,
                                }) => [
                                        styles.skipButton,
                                        pressed &&
                                        styles.pressed,
                                    ]}
                            >
                                <Text
                                    style={[
                                        styles.skipText,
                                        dynamicStyles.skipText,
                                    ]}
                                >
                                    Skip
                                </Text>
                            </Pressable>
                        ) : (
                            <View
                                style={
                                    styles.skipPlaceholder
                                }
                            />
                        )}
                    </View>

                    <View
                        style={
                            styles.carouselContainer
                        }
                    >
                        <Carousel
                            ref={
                                carouselRef
                            }
                            data={
                                ONBOARDING_SLIDES
                            }
                            keyExtractor={(
                                item,
                            ) =>
                                item.id
                            }
                            style={
                                styles.carousel
                            }
                            itemSize={
                                SCREEN_WIDTH
                            }
                            loop={false}
                            scrollEnabled
                            snapMode="page"
                            overscrollEnabled={
                                false
                            }
                            layout={{
                                type: "parallax",
                                offset: 44,
                                scale: 0.92,
                                adjacentScale:
                                    0.84,
                            }}
                            animation={{
                                type: "spring",
                                damping: 18,
                                stiffness: 180,
                                mass: 0.8,
                            }}
                            onSnapToItem={
                                setActiveIndex
                            }
                            renderItem={
                                renderSlide
                            }
                        />
                    </View>

                    <View
                        style={
                            styles.pagination
                        }
                    >
                        {ONBOARDING_SLIDES.map(
                            (
                                slide,
                                index,
                            ) => {
                                const isActive =
                                    index ===
                                    activeIndex;

                                return (
                                    <View
                                        key={
                                            slide.id
                                        }
                                        style={[
                                            styles.dot,
                                            dynamicStyles.dot,
                                            isActive &&
                                            styles.activeDot,
                                            isActive &&
                                            dynamicStyles.activeDot,
                                        ]}
                                    />
                                );
                            },
                        )}
                    </View>

                    <View
                        style={
                            styles.actions
                        }
                    >
                        <GlassButton
                            label={
                                isLastSlide
                                    ? "Create Account"
                                    : "Next"
                            }
                            icon={
                                <Ionicons
                                    name={
                                        isLastSlide
                                            ? "person-add-outline"
                                            : "arrow-forward-outline"
                                    }
                                    size={20}
                                    color={
                                        theme.icon
                                    }
                                />
                            }
                            onPress={
                                handleNext
                            }
                        />

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Sign in"
                            onPress={
                                handleSignIn
                            }
                            style={({
                                pressed,
                            }) => [
                                    styles.signInButton,
                                    pressed &&
                                    styles.pressed,
                                ]}
                        >
                            <Text
                                style={[
                                    styles.signInPrefix,
                                    dynamicStyles.signInPrefix,
                                ]}
                            >
                                Already have an
                                account?{" "}
                            </Text>

                            <Text
                                style={[
                                    styles.signInText,
                                    dynamicStyles.signInText,
                                ]}
                            >
                                Sign In
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}


const styles = StyleSheet.create({
    root: {
        flex: 1,
    },

    safeArea: {
        flex: 1,
    },

    container: {
        flex: 1,
    },

    header: {
        minHeight: 60,
        paddingHorizontal: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent:
            "space-between",
    },

    brandContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
    },

    brandIcon: {
        width: 38,
        height: 38,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        borderWidth:
            StyleSheet.hairlineWidth,
    },

    brand: {
        fontSize: 19,
        fontWeight: "800",
        letterSpacing: -0.3,
    },

    skipButton: {
        minWidth: 50,
        minHeight: 40,
        alignItems: "center",
        justifyContent: "center",
    },

    skipPlaceholder: {
        width: 50,
        height: 40,
    },

    skipText: {
        fontSize: 15,
        fontWeight: "600",
    },

    carouselContainer: {
        flex: 1,
        justifyContent: "center",
    },

    carousel: {
        width: SCREEN_WIDTH,
        height: CAROUSEL_HEIGHT,
    },

    slide: {
        flex: 1,
        paddingHorizontal:
            CARD_HORIZONTAL_MARGIN,
        justifyContent: "center",
    },

    card: {
        width: CARD_WIDTH,
        alignSelf: "center",
    },

    cardContent: {
        minHeight: 430,
        padding: 24,
        justifyContent:
            "space-between",
    },

    visualArea: {
        height: 205,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },

    visualGlow: {
        position: "absolute",
        width: 190,
        height: 190,
        borderRadius: 95,
    },

    animationContainer: {
        width: 190,
        height: 190,
        alignItems: "center",
        justifyContent: "center",
    },

    animation: {
        width: 190,
        height: 190,
    },

    copyContainer: {
        paddingTop: 14,
    },

    eyebrow: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "800",
        letterSpacing: 1.15,
        marginBottom: 10,
    },

    title: {
        fontSize: 30,
        lineHeight: 35,
        fontWeight: "800",
        letterSpacing: -0.8,
    },

    description: {
        fontSize: 16,
        lineHeight: 24,
        marginTop: 14,
    },

    pagination: {
        minHeight: 28,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        marginTop: 2,
    },

    dot: {
        width: 7,
        height: 7,
        borderRadius: 999,
    },

    activeDot: {
        width: 24,
    },

    actions: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 8,
    },

    signInButton: {
        minHeight: 48,
        marginTop: 5,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    signInPrefix: {
        fontSize: 14,
        fontWeight: "500",
    },

    signInText: {
        fontSize: 14,
        fontWeight: "800",
    },

    pressed: {
        opacity: 0.55,
    },
});