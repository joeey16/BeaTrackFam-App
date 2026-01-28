import "~/global.css";
import "~/appearance-polyfill";

import {
  Theme as NavigationTheme,
  ThemeProvider as NavigationThemeProvider,
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Platform, View } from "react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import { ThemeToggle } from "~/components/ThemeToggle";
import { ThemeProvider, useTheme } from "~/theming/ThemeProvider";
import { StripeProviderWrapper } from "~/lib/stripe/StripeProviderWrapper";
import darkTheme from "~/theming/themes/dark";
import lightTheme from "~/theming/themes/light";
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { PortalHost } from "@rn-primitives/portal";
import { WebPortalContext } from "~/components/WebPortalContext";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "~/lib/contexts/AuthContext";
import { CartProvider } from "~/lib/contexts/CartContext";
import { WishlistProvider } from "~/lib/contexts/WishlistContext";
import { OnboardingProvider } from "~/lib/contexts/OnboardingContext";
import { PreferencesProvider } from "~/lib/contexts/PreferencesContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
});

export { ErrorBoundary } from "expo-router";

function RootContent() {
  const hasMounted = React.useRef(false);
  const portalContainer = React.useRef<View>(null);
  const { isDarkColorScheme } = useColorScheme();
  const { theme, setTheme } = useTheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
  const insets = useSafeAreaInsets();
  const headerExtraOffset = 16;
  const isAndroid = Platform.OS === "android";

  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const isLoadingFonts = !fontsLoaded && !fontError;

  const navigationTheme: NavigationTheme = React.useMemo(() => {
    const navigationThemeBase = isDarkColorScheme ? NavigationDarkTheme : NavigationDefaultTheme;
    const baseColors = navigationThemeBase.colors;
    return {
      ...navigationThemeBase,
      colors: {
        ...baseColors,
        background: theme.colors.background ?? baseColors.background,
        border: theme.colors.border ?? baseColors.border,
        card: theme.colors.card ?? baseColors.card,
        notification: theme.colors.destructive ?? baseColors.notification,
        primary: theme.colors.primary ?? baseColors.primary,
        text: theme.colors.foreground ?? baseColors.text,
      },
    };
  }, [theme, isDarkColorScheme]);

  React.useEffect(() => {
    const newTheme = isDarkColorScheme ? "dark" : "light";
    if (theme.name !== newTheme) {
      setTheme(newTheme);
    }
  }, [isDarkColorScheme, theme.name, setTheme]);

  React.useEffect(() => {
    if (hasMounted.current) {
      return;
    }

    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.classList.add("bg-background");
    }
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, []);

  React.useEffect(() => {
    if (!isLoadingFonts) {
      SplashScreen.hideAsync();
    }
  }, [isLoadingFonts]);

  if (!isColorSchemeLoaded || isLoadingFonts) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: isDarkColorScheme ? "#000000" : "#ffffff" }}
      />
    );
  }

  return (
    <WebPortalContext.Provider value={{ container: portalContainer.current as HTMLElement | null }}>
      <NavigationThemeProvider value={navigationTheme}>
        <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
        <Stack
          screenOptions={() => ({
            headerStatusBarHeight: isAndroid ? insets.top : insets.top + headerExtraOffset,
            headerStyle: {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.border,
              height: 56 + (isAndroid ? insets.top : insets.top + headerExtraOffset),
              paddingTop: isAndroid ? insets.top : insets.top + headerExtraOffset,
            },
            headerTintColor: theme.colors.foreground,
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontFamily: theme.typography.h1?.fontFamily,
            },
            headerRight: () => <ThemeToggle />,
          })}
        >
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="auth/welcome"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen name="auth/login" options={{ title: "Log In", presentation: "modal" }} />
          <Stack.Screen name="auth/signup" options={{ title: "Sign Up", presentation: "modal" }} />
          <Stack.Screen
            name="auth/forgot-password"
            options={{ title: "Forgot Password", presentation: "modal" }}
          />
          <Stack.Screen
            name="product/[handle]"
            options={{ title: "Product Details", headerBackTitle: "Back" }}
          />
          <Stack.Screen
            name="collection/[handle]"
            options={{ title: "Collection", headerBackTitle: "Back" }}
          />
          <Stack.Screen name="checkout" options={{ title: "Checkout", headerBackTitle: "Back" }} />
          <Stack.Screen
            name="orders"
            options={{ title: "Order History", headerBackTitle: "Back" }}
          />
          <Stack.Screen name="debug" options={{ title: "Debug" }} />
          <Stack.Screen
            name="support"
            options={{ title: "Support Center", headerBackTitle: "Back" }}
          />
          <Stack.Screen name="settings" options={{ title: "Settings", headerBackTitle: "Back" }} />
          <Stack.Screen name="app-tracking" options={{ title: "App Tracking" }} />
          <Stack.Screen
            name="profile"
            options={{ title: "Edit Profile", headerBackTitle: "Back" }}
          />
        </Stack>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
          }}
          ref={portalContainer}
        />
        <PortalHost />
      </NavigationThemeProvider>
    </WebPortalContext.Provider>
  );
}

export default function RootLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const stripeMerchantId =
    process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID ?? "merchant.com.beatrackfaminc";

  return (
    <StripeProviderWrapper
      publishableKey={stripePublishableKey}
      merchantIdentifier={stripeMerchantId}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          initialThemeName={isDarkColorScheme ? "dark" : "light"}
          themes={[lightTheme, darkTheme]}
        >
          <OnboardingProvider>
            <PreferencesProvider>
              <AuthProvider>
                <CartProvider>
                  <WishlistProvider>
                    <RootContent />
                  </WishlistProvider>
                </CartProvider>
              </AuthProvider>
            </PreferencesProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StripeProviderWrapper>
  );
}
