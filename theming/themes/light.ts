import { Theme } from "../Theme";

const lightTheme: Theme = {
  name: "light",
  colors: {
    background: "hsl(0 0% 100%)",
    foreground: "hsl(0 0% 0%)",
    card: "hsl(0 0% 98%)",
    cardForeground: "hsl(0 0% 0%)",
    popover: "hsl(0 0% 100%)",
    popoverForeground: "hsl(0 0% 0%)",
    primary: "hsl(0 0% 0%)",
    primaryForeground: "hsl(0 0% 100%)",
    secondary: "hsl(0 0% 96%)",
    secondaryForeground: "hsl(0 0% 10%)",
    tertiary: "hsl(0 0% 20%)",
    tertiaryForeground: "hsl(0 0% 98%)",
    muted: "hsl(0 0% 96%)",
    mutedForeground: "hsl(0 0% 45%)",
    accent: "hsl(0 0% 96%)",
    accentForeground: "hsl(0 0% 10%)",
    success: "hsl(142 70.6% 45.3%)",
    successForeground: "hsl(0 0% 98%)",
    warning: "hsl(45 100% 51%)",
    warningForeground: "hsl(0 0% 0%)",
    destructive: "hsl(0 84.2% 60.2%)",
    destructiveForeground: "hsl(0 0% 98%)",
    border: "hsl(0 0% 90%)",
    notification: "hsl(0 0% 90%)",
    input: "hsl(0 0% 90%)",
    ring: "hsl(0 0% 0%)",
    overlay: "hsl(0 0% 0%)",
  },
  typography: {
    h1: {
      fontSize: "32px",
      fontFamily: "Inter_700Bold",
    },
    h2: {
      fontSize: "24px",
      fontFamily: "Inter_700Bold",
    },
    h3: {
      fontSize: "20px",
      fontFamily: "Inter_600SemiBold",
    },
    h4: {
      fontSize: "18px",
      fontFamily: "Inter_600SemiBold",
    },
    h5: {
      fontSize: "16px",
      fontFamily: "Inter_500Medium",
    },
    h6: {
      fontSize: "14px",
      fontFamily: "Inter_500Medium",
    },
    body: {
      fontSize: "14px",
      fontFamily: "Inter_400Regular",
    },
    caption: {
      fontSize: "12px",
      fontFamily: "Inter_300Light",
    },
    button: {
      fontSize: "16px",
      fontFamily: "Inter_500Medium",
    },
  },
};

export default lightTheme;
