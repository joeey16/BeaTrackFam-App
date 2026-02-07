import * as React from "react";
import { View, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { usePreferences } from "~/lib/contexts/PreferencesContext";
import { useTheme } from "~/theming/ThemeProvider";
import LucideIcon from "~/lib/icons/LucideIcon";

export default function NotificationPermissionScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const isFromSettings = source === "settings";
  const { preferences, updatePreferences, isLoading } = usePreferences();
  const { theme } = useTheme();
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [isNativeAvailable, setIsNativeAvailable] = React.useState(true);
  const [showSavedBanner, setShowSavedBanner] = React.useState(false);
  const [draftPreferences, setDraftPreferences] = React.useState({
    orderUpdates: true,
    newDrops: true,
    exclusiveOffers: false,
    accountActivity: true,
  });
  const hasInitialized = React.useRef(false);

  React.useEffect(() => {
    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      setIsNativeAvailable(false);
    }
  }, []);

  React.useEffect(() => {
    if (isLoading || hasInitialized.current) {
      return;
    }

    setDraftPreferences({
      orderUpdates: preferences.notificationOrderUpdates,
      newDrops: preferences.notificationNewDrops,
      exclusiveOffers: preferences.notificationExclusiveOffers,
      accountActivity: preferences.notificationAccountActivity,
    });
    hasInitialized.current = true;
  }, [isLoading, preferences]);

  const finalizeNavigation = () => {
    router.replace(isFromSettings ? "/settings" : "/onboarding-location");
  };

  const showChangesSaved = () => {
    if (!isFromSettings) {
      finalizeNavigation();
      return;
    }
    setShowSavedBanner(true);
    if (Platform.OS !== "web") {
      setTimeout(() => {
        setShowSavedBanner(false);
      }, 2500);
    }
  };

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      if (!hasInitialized.current) {
        return;
      }

      await updatePreferences({
        notificationOrderUpdates: draftPreferences.orderUpdates,
        notificationNewDrops: draftPreferences.newDrops,
        notificationExclusiveOffers: draftPreferences.exclusiveOffers,
        notificationAccountActivity: draftPreferences.accountActivity,
      });

      const hasSelections = Object.values(draftPreferences).some(Boolean);

      if (
        isNativeAvailable &&
        hasSelections &&
        (Platform.OS === "ios" || Platform.OS === "android")
      ) {
        let notificationsModule: {
          getPermissionsAsync: () => Promise<{
            status: string;
          }>;
          requestPermissionsAsync: () => Promise<{
            status: string;
          }>;
        } | null = null;

        try {
          notificationsModule = (await import("expo-notifications")) as typeof notificationsModule;
        } catch (error) {
          notificationsModule = null;
        }

        if (!notificationsModule) {
          console.log("ℹ️ Notifications module not available in this environment");
          setIsNativeAvailable(false);
          return;
        }

        const { status: existingStatus } = await notificationsModule.getPermissionsAsync();

        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await notificationsModule.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === "granted") {
          console.log("✅ Notification permissions granted");
        } else {
          console.log("ℹ️ Notification permissions denied");
        }
      }
    } catch (error) {
      console.error("Failed to request notification permissions:", error);
      setIsNativeAvailable(false);
    } finally {
      setIsRequesting(false);
      showChangesSaved();
    }
  };

  const isDirty =
    draftPreferences.orderUpdates !== preferences.notificationOrderUpdates ||
    draftPreferences.newDrops !== preferences.notificationNewDrops ||
    draftPreferences.exclusiveOffers !== preferences.notificationExclusiveOffers ||
    draftPreferences.accountActivity !== preferences.notificationAccountActivity;

  const handleSkip = () => {
    finalizeNavigation();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          title: "Notifications",
        }}
      />
      <View className="flex-1 items-center justify-center px-8">
        {isFromSettings ? (
          <>
            {/* Icon */}
            <View
              className="h-20 w-20 items-center justify-center rounded-full mb-4"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <LucideIcon name="Bell" size={40} color={theme.colors.primaryForeground} />
            </View>

            {/* Title */}
            <Text className="mb-3 text-center text-3xl font-bold text-foreground">
              Notification Preferences
            </Text>

            {/* Description */}
            <Text className="mb-6 text-center text-base leading-6 text-muted-foreground">
              {isNativeAvailable
                ? "Choose the alerts you want. You can update these anytime in Settings."
                : "Notifications aren’t available in this preview build. You can enable them later in your device Settings."}
            </Text>

            {/* Preferences */}
            <View className="mb-10 w-full">
              <View className="mb-3 rounded-2xl bg-card px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-base font-semibold text-foreground">Order Updates</Text>
                    <Text className="text-sm text-muted-foreground">
                      Shipping and delivery status
                    </Text>
                  </View>
                  <Switch
                    checked={draftPreferences.orderUpdates}
                    onCheckedChange={(checked) =>
                      setDraftPreferences((prev) => ({ ...prev, orderUpdates: checked }))
                    }
                  />
                </View>
              </View>

              <View className="mb-3 rounded-2xl bg-card px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-base font-semibold text-foreground">New Drops</Text>
                    <Text className="text-sm text-muted-foreground">
                      Limited releases and launches
                    </Text>
                  </View>
                  <Switch
                    checked={draftPreferences.newDrops}
                    onCheckedChange={(checked) =>
                      setDraftPreferences((prev) => ({ ...prev, newDrops: checked }))
                    }
                  />
                </View>
              </View>

              <View className="mb-3 rounded-2xl bg-card px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-base font-semibold text-foreground">
                      Exclusive Offers
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Member-only discounts and promos
                    </Text>
                  </View>
                  <Switch
                    checked={draftPreferences.exclusiveOffers}
                    onCheckedChange={(checked) =>
                      setDraftPreferences((prev) => ({ ...prev, exclusiveOffers: checked }))
                    }
                  />
                </View>
              </View>

              <View className="rounded-2xl bg-card px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-base font-semibold text-foreground">
                      Account Activity
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Security and account alerts
                    </Text>
                  </View>
                  <Switch
                    checked={draftPreferences.accountActivity}
                    onCheckedChange={(checked) =>
                      setDraftPreferences((prev) => ({ ...prev, accountActivity: checked }))
                    }
                  />
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Icon */}
            <View
              className="h-24 w-24 items-center justify-center rounded-full mb-6"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <LucideIcon name="Bell" size={48} color={theme.colors.primaryForeground} />
            </View>

            {/* Title */}
            <Text className="mb-4 text-center text-3xl font-bold text-foreground">
              Stay in the Loop
            </Text>

            {/* Description */}
            <Text className="mb-8 text-center text-base leading-6 text-muted-foreground">
              {isNativeAvailable
                ? "Get notified about new drops, order updates, and exclusive deals. Never miss out on limited edition releases."
                : "Notifications aren’t available in this preview build. You can enable them later in your device Settings."}
            </Text>

            {/* Benefits */}
            <View className="mb-12 w-full">
              <View className="mb-4 flex-row items-start">
                <View className="flex-1">
                  <Text className="mb-1 text-base font-semibold text-foreground">
                    Order Updates
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Track your orders in real-time
                  </Text>
                </View>
              </View>

              <View className="mb-4 flex-row items-start">
                <View className="flex-1">
                  <Text className="mb-1 text-base font-semibold text-foreground">
                    Exclusive Drops
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Be first to know about new releases
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="flex-1">
                  <Text className="mb-1 text-base font-semibold text-foreground">
                    Special Offers
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Get exclusive discounts and deals
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Bottom Buttons */}
      <View className="px-8 pb-12">
        <Button
          onPress={handleEnableNotifications}
          size="lg"
          className="mb-3 w-full"
          disabled={isRequesting || (isFromSettings && (!isDirty || !hasInitialized.current))}
        >
          <Text className="font-semibold">
            {isFromSettings
              ? isNativeAvailable
                ? "Save Preferences"
                : "Continue"
              : isNativeAvailable
                ? "Enable Notifications"
                : "Notifications Unavailable"}
          </Text>
        </Button>

        {isFromSettings && (
          <Button onPress={handleSkip} variant="outline" size="lg" className="w-full">
            <Text className="font-semibold">Back to Settings</Text>
          </Button>
        )}
      </View>

      {/* Saved Banner */}
      {showSavedBanner && isFromSettings && (
        <View className="absolute top-16 left-4 right-4" style={{ zIndex: 9999 }}>
          <View
            className="flex-row items-center rounded-xl px-4 py-3 shadow-lg"
            style={{
              backgroundColor: theme.colors.primary,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <LucideIcon name="CircleCheck" size={20} color={theme.colors.primaryForeground} />
            <View className="ml-3 flex-1">
              <Text className="font-semibold" style={{ color: theme.colors.primaryForeground }}>
                Changes Saved Successfully!
              </Text>
              <Text
                className="text-xs"
                style={{ color: theme.colors.primaryForeground, opacity: 0.95 }}
              >
                Your notification preferences have been updated
              </Text>
            </View>
            <Pressable
              onPress={() => setShowSavedBanner(false)}
              className="ml-3 rounded-full p-1"
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
            >
              <LucideIcon name="X" size={18} color={theme.colors.primaryForeground} />
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
