import * as React from "react";
import { View, Platform, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";

const styles = {
  container: "flex-1 bg-background",
  content: "flex-1 items-center justify-center px-8",
  title: "mb-3 text-center text-3xl font-bold text-foreground",
  description: "mb-6 text-center text-base leading-6 text-muted-foreground",
  statusCard: "w-full rounded-2xl bg-card px-5 py-4 mb-8",
  statusLabel: "text-xs uppercase tracking-widest text-muted-foreground mb-1",
  statusValue: "text-base font-semibold text-foreground",
  note: "text-center text-sm text-muted-foreground",
  actions: "px-8 pb-12",
};

const trackingPrompt =
  "BeaTrackFam uses tracking to personalize your shopping experience and provide you with relevant product recommendations and exclusive offers.";

function getStatusLabel(status: string) {
  switch (status) {
    case "granted":
      return "Enabled";
    case "denied":
      return "Not Allowed";
    case "restricted":
      return "Restricted";
    case "unavailable":
      return "Not Available";
    case "undetermined":
      return "Not Set";
    default:
      return "Unknown";
  }
}

export default function AppTrackingScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const isFromSettings = source === "settings";

  React.useEffect(() => {
    if (Platform.OS !== "ios") {
      router.replace("/auth/welcome");
    }
  }, []);

  const trackingModule = Platform.OS === "ios" ? require("expo-tracking-transparency") : null;

  const [status, setStatus] = React.useState<string>("undetermined");
  const [isRequesting, setIsRequesting] = React.useState(false);

  const loadStatus = React.useCallback(async () => {
    if (Platform.OS !== "ios" || !trackingModule) {
      setStatus("unavailable");
      return;
    }

    try {
      if (trackingModule.getTrackingPermissionsAsync) {
        const result = await trackingModule.getTrackingPermissionsAsync();
        setStatus(result.status ?? "undetermined");
      } else {
        setStatus("unavailable");
      }
    } catch (error) {
      setStatus("unavailable");
    }
  }, [trackingModule]);

  React.useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSyncTracking = async () => {
    if (Platform.OS !== "ios" || !trackingModule) {
      return;
    }

    setIsRequesting(true);

    try {
      if (trackingModule.requestTrackingPermissionsAsync) {
        const result = await trackingModule.requestTrackingPermissionsAsync();
        setStatus(result.status ?? "undetermined");
      }
    } catch (error) {
      setStatus("unavailable");
    } finally {
      setIsRequesting(false);
      router.replace("/auth/welcome");
    }
  };

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      try {
        await Linking.openURL("app-settings:");
      } catch (fallbackError) {}
    }
  };

  return (
    <SafeAreaView className={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: "App Tracking" }} />

      <View className={styles.content}>
        <Text className={styles.title}>App Tracking Transparency</Text>
        <Text className={styles.description}>{trackingPrompt}</Text>

        <View className={styles.statusCard}>
          <Text className={styles.statusLabel}>Current Status</Text>
          <Text className={styles.statusValue}>{getStatusLabel(status)}</Text>
        </View>

        <Text className={styles.note}>
          This setting is available on iPhone and iPad. You can change it in iOS Settings → Privacy
          &amp; Security → Tracking.
        </Text>
      </View>

      <View className={styles.actions}>
        {!isFromSettings && (
          <Button
            onPress={handleSyncTracking}
            size="lg"
            className="mb-3 w-full"
            disabled={isRequesting || Platform.OS !== "ios" || status === "granted"}
          >
            <Text className="font-semibold">Sync Tracking Preference</Text>
          </Button>
        )}

        {Platform.OS === "ios" && isFromSettings && (
          <Button onPress={handleOpenSettings} variant="outline" size="lg" className="mb-3 w-full">
            <Text className="font-semibold">Open iOS Settings</Text>
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
