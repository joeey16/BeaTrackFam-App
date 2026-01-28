import * as React from "react";
import { View, Image, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useTheme } from "~/theming/ThemeProvider";
import { useOnboarding } from "~/lib/contexts/OnboardingContext";
import { router } from "expo-router";
export default function WelcomeScreen() {
  const { theme } = useTheme();
  const { completeWelcome } = useOnboarding();
  const { width, height } = useWindowDimensions();
  // Responsive sizing
  const isSmallScreen = width < 375 || height < 667;
  const iconContainerSize = isSmallScreen ? 96 : 128;
  const iconSize = isSmallScreen ? 48 : 64;
  const horizontalPadding = Math.max(width * 0.08, 24);
  const handleLogin = () => {
    router.push("/auth/login");
  };
  const handleSignup = () => {
    router.push("/auth/signup");
  };
  const handleContinueAsGuest = async () => {
    await completeWelcome();
    router.replace("/(tabs)");
  };
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <View
        className="flex-1"
        style={{
          paddingHorizontal: horizontalPadding,
          paddingVertical: isSmallScreen ? 24 : 48,
        }}
      >
        {/* Logo/Icon Section */}
        <View className="flex-1 items-center justify-center">
          <View
            className="items-center justify-center"
            style={{
              width: iconContainerSize,
              height: iconContainerSize,
              marginBottom: isSmallScreen ? 24 : 32,
            }}
          >
            <Image
              source={require("~/assets/appicon.png")}
              style={{
                width: iconContainerSize,
                height: iconContainerSize,
                borderRadius: iconContainerSize / 2,
              }}
              resizeMode="cover"
            />
          </View>
          <Text
            className="mb-4 text-center font-bold text-foreground"
            style={{ fontSize: isSmallScreen ? 24 : 32 }}
          >
            Welcome to BeaTrackFam
          </Text>
          <Text
            className="text-center text-muted-foreground"
            style={{
              fontSize: isSmallScreen ? 14 : 16,
              lineHeight: isSmallScreen ? 20 : 24,
            }}
          >
            Sign in to save your favorites, track orders, and get exclusive access to limited drops.
          </Text>
        </View>
        {/* Auth Buttons */}
        <View style={{ marginBottom: isSmallScreen ? 24 : 32 }}>
          <Button
            onPress={handleLogin}
            size={isSmallScreen ? "default" : "lg"}
            className="mb-3 w-full"
          >
            <Text className="font-semibold" style={{ fontSize: isSmallScreen ? 14 : 16 }}>
              Log In
            </Text>
          </Button>
          <Button
            onPress={handleSignup}
            size={isSmallScreen ? "default" : "lg"}
            variant="outline"
            className="mb-3 w-full"
          >
            <Text
              className="font-semibold text-foreground"
              style={{ fontSize: isSmallScreen ? 14 : 16 }}
            >
              Create Account
            </Text>
          </Button>
          <Button onPress={handleContinueAsGuest} variant="ghost" className="w-full">
            <Text className="text-muted-foreground" style={{ fontSize: isSmallScreen ? 14 : 16 }}>
              Continue as Guest
            </Text>
          </Button>
        </View>
        {/* Footer */}
        <View className="items-center">
          <Text className="text-muted-foreground" style={{ fontSize: isSmallScreen ? 10 : 12 }}>
            Loyalty Above All
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
