import { Platform } from "react-native";

export const colors = {
  background: "#f4f6f4",
  surface: "#ffffff",
  header: "#0A2E19",
  headerDark: "#072012",
  primary: "#0A2E19",
  primaryLight: "#1b8a18",
  accent: "#4caf50",
  text: "#1a2e28",
  textMuted: "#6b7f78",
  textOnDark: "#ffffff",
  textOnDarkMuted: "rgba(255,255,255,0.75)",
  border: "#e8ece9",
  tabInactive: "#9aa8a2",
  warning: "#ffc107",
  blue: "#2196f3",
  red: "#ef5350",
  yellow: "#ffc107",
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
};

export const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  android: {
    elevation: 6,
  },
  default: {},
});

export const fonts = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semiBold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extraBold: "Manrope_800ExtraBold",
};
