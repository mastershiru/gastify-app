export type GastifyColorScheme =
  | "light"
  | "dark";

export type GastifyTheme = {
  background: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  glassTint: string;
  glassGlow: string;
  glassBorder: string;
  glassSurface: string;

  brandSurface: string;
  brandBorder: string;

  primaryButton: string;
  primaryButtonText: string;

  secondaryButtonText: string;

  paginationInactive: string;
  paginationActive: string;

  icon: string;
};


export const GASTIFY_THEMES: Record<
  GastifyColorScheme,
  GastifyTheme
> = {
  light: {
    background: "#EEF4F2",

    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#64748B",

    glassTint:
      "rgba(255,255,255,0.48)",

    glassGlow:
      "rgba(255,255,255,0.62)",

    glassBorder:
      "rgba(255,255,255,0.78)",

    glassSurface:
      "rgba(255,255,255,0.34)",

    brandSurface:
      "rgba(255,255,255,0.46)",

    brandBorder:
      "rgba(255,255,255,0.78)",

    primaryButton:
      "#0F172A",

    primaryButtonText:
      "#FFFFFF",

    secondaryButtonText:
      "#334155",

    paginationInactive:
      "rgba(100,116,139,0.28)",

    paginationActive:
      "#0F172A",

    icon: "#0F172A",
  },

  dark: {
    background: "#07110E",

    textPrimary: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",

    glassTint:
      "rgba(15,23,42,0.46)",

    glassGlow:
      "rgba(255,255,255,0.08)",

    glassBorder:
      "rgba(255,255,255,0.12)",

    glassSurface:
      "rgba(15,23,42,0.38)",

    brandSurface:
      "rgba(255,255,255,0.08)",

    brandBorder:
      "rgba(255,255,255,0.14)",

    primaryButton:
      "#F8FAFC",

    primaryButtonText:
      "#07110E",

    secondaryButtonText:
      "#E2E8F0",

    paginationInactive:
      "rgba(203,213,225,0.25)",

    paginationActive:
      "#F8FAFC",

    icon: "#F8FAFC",
  },
};

// Compatibility palette for the Expo starter themed components that remain in
// the project. New Gastify screens should use GASTIFY_THEMES directly.
export const Colors = {
  light: {
    text: GASTIFY_THEMES.light.textPrimary,
    background: GASTIFY_THEMES.light.background,
    icon: GASTIFY_THEMES.light.icon,
    tint: GASTIFY_THEMES.light.textPrimary,
  },
  dark: {
    text: GASTIFY_THEMES.dark.textPrimary,
    background: GASTIFY_THEMES.dark.background,
    icon: GASTIFY_THEMES.dark.icon,
    tint: GASTIFY_THEMES.dark.textPrimary,
  },
} as const;
