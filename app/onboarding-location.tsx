import * as React from "react";
import { View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { router, Stack } from "expo-router";
import { useTheme } from "~/theming/ThemeProvider";
import LucideIcon from "~/lib/icons/LucideIcon";

export default function LocationPermissionScreen() {
  const { theme } = useTheme();
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [isNativeAvailable, setIsNativeAvailable] = React.useState(true);

  React.useEffect(() => {
    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      setIsNativeAvailable(false);
    }
  }, []);

  const handleEnableLocation = async () => {
    setIsRequesting(true);
    try {
      if (Platform.OS === "ios" || Platform.OS === "android") {
        let locationModule: {
          getForegroundPermissionsAsync: () => Promise<{
            status: string;
          }>;
          requestForegroundPermissionsAsync: () => Promise<{
            status: string;
          }>;
        } | null = null;

        try {
          locationModule = (await import("expo-location")) as typeof locationModule;
        } catch (error) {
          locationModule = null;
        }

        if (!locationModule) {
          console.log("ℹ️ Location module not available in this environment");
          setIsNativeAvailable(false);
          return;
        }

        const { status: existingStatus } = await locationModule.getForegroundPermissionsAsync();

        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await locationModule.requestForegroundPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === "granted") {
          console.log("✅ Location permissions granted");
        } else {
          console.log("ℹ️ Location permissions denied");
        }
      }
    } catch (error) {
      console.error("Failed to request location permissions:", error);
      setIsNativeAvailable(false);
    } finally {
      setIsRequesting(false);
      const nextRoute = Platform.OS === "ios" ? "/app-tracking?source=onboarding" : "/auth/welcome";
      router.replace(nextRoute);
    }
  };

  const handleSkip = () => {
    const nextRoute = Platform.OS === "ios" ? "/app-tracking?source=onboarding" : "/auth/welcome";
    router.replace(nextRoute);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          title: "Location",
        }}
      />
      <View className="flex-1 items-center justify-center px-8">
        {/* Icon */}
        <View
          className="h-24 w-24 items-center justify-center rounded-full mb-6"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <LucideIcon name="MapPin" size={48} color={theme.colors.primaryForeground} />
        </View>

        {/* Title */}
        <Text className="mb-4 text-center text-3xl font-bold text-foreground">Find Your Way</Text>

        {/* Description */}
        <Text className="mb-8 text-center text-base leading-6 text-muted-foreground">
          {isNativeAvailable
            ? "Enable location services to get accurate shipping estimates and discover local events and pop-up shops near you."
            : "Location services aren’t available in this preview build. You can enable them later in your device Settings."}
        </Text>

        {/* Benefits */}
        <View className="mb-12 w-full">
          <View className="mb-4 flex-row items-start">
            <View className="flex-1">
              <Text className="mb-1 text-base font-semibold text-foreground">
                Accurate Shipping
              </Text>
              <Text className="text-sm text-muted-foreground">
                Get precise delivery estimates to your address
              </Text>
            </View>
          </View>

          <View className="mb-4 flex-row items-start">
            <View className="flex-1">
              <Text className="mb-1 text-base font-semibold text-foreground">Faster Checkout</Text>
              <Text className="text-sm text-muted-foreground">Auto-fill your shipping address</Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="flex-1">
              <Text className="mb-1 text-base font-semibold text-foreground">Local Events</Text>
              <Text className="text-sm text-muted-foreground">
                Discover pop-up shops and events near you
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View className="px-8 pb-12">
        <Button
          onPress={handleEnableLocation}
          size="lg"
          className="mb-3 w-full"
          disabled={isRequesting || !isNativeAvailable}
        >
          <Text className="font-semibold">
            {isNativeAvailable ? "Continue" : "Location Unavailable"}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
