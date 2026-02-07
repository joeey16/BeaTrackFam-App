import * as React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useTheme } from "~/theming/ThemeProvider";
import LucideIcon from "~/lib/icons/LucideIcon";
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
export default function AppTrackingScreenWeb() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const isFromSettings = source === "settings";
  const { theme } = useTheme();

  return (
    <SafeAreaView className={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: "App Tracking" }} />
      <View className={styles.content}>
        <View
          className="h-24 w-24 items-center justify-center rounded-full mb-6"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <LucideIcon name="Shield" size={48} color={theme.colors.primaryForeground} />
        </View>

        <Text className={styles.title}>Your Privacy Matters</Text>
        <Text className={styles.description}>
          App Tracking Transparency is available on iPhone and iPad. This setting can only be
          managed on the mobile app.
        </Text>
        <View className={styles.statusCard}>
          <Text className={styles.statusLabel}>Current Status</Text>
          <Text className={styles.statusValue}>Not Available on Web</Text>
        </View>
        <Text className={styles.note}>Open the mobile app to sync your tracking preference.</Text>
      </View>
      <View className={styles.actions}>
        {!isFromSettings && (
          <Button size="lg" className="mb-3 w-full" disabled>
            <Text className="font-semibold">Sync Tracking Preference</Text>
          </Button>
        )}
        {isFromSettings && (
          <Button size="lg" variant="outline" className="mb-3 w-full" disabled>
            <Text className="font-semibold">Open iOS Settings</Text>
          </Button>
        )}
        {!isFromSettings && (
          <Button onPress={() => router.replace("/auth/welcome")} variant="ghost" size="lg">
            <Text className="text-foreground">Continue</Text>
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
