import * as React from "react";
import { View, ScrollView, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { useTheme } from "~/theming/ThemeProvider";
import { useColorScheme } from "~/lib/useColorScheme";
import LucideIcon from "~/lib/icons/LucideIcon";
import Constants from "expo-constants";
import { Stack, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center rounded-2xl bg-card p-4 mb-3"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10 mr-4">
        <LucideIcon name={icon} size={20} color={theme.colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {subtitle && <Text className="text-sm text-muted-foreground">{subtitle}</Text>}
      </View>
      {showChevron && onPress && (
        <LucideIcon name="ChevronRight" size={20} color={theme.colors.mutedForeground} />
      )}
    </Pressable>
  );
}

function SettingToggle({
  icon,
  title,
  subtitle,
  value,
  onToggle,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onToggle} className="flex-row items-center rounded-2xl bg-card p-4 mb-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10 mr-4">
        <LucideIcon
          name={icon}
          size={20}
          strokeWidth={icon === "Sun" || icon === "Moon" ? 2.5 : 2}
          color={theme.colors.primary}
        />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {subtitle && <Text className="text-sm text-muted-foreground">{subtitle}</Text>}
      </View>
      <View
        className="h-8 w-14 rounded-full"
        style={{
          backgroundColor: value ? theme.colors.primary : theme.colors.muted,
          justifyContent: "center",
          paddingHorizontal: 2,
        }}
      >
        <View
          className="h-7 w-7 rounded-full bg-background"
          style={{
            alignSelf: value ? "flex-end" : "flex-start",
          }}
        />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { isDarkColorScheme, toggleColorScheme } = useColorScheme();
  const currentYear = new Date().getFullYear();

  // Get version info
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const buildNumber = Platform.select({
    ios: Constants.expoConfig?.ios?.buildNumber ?? "1",
    android: Constants.expoConfig?.android?.versionCode?.toString() ?? "1",
    default: "1",
  });
  const nativeVersion = Constants.nativeAppVersion ?? appVersion;
  const nativeBuildVersion = Constants.nativeBuildVersion ?? buildNumber;

  // Get platform info
  const platformName = Platform.select({
    ios: `iOS ${Constants.platform?.ios?.platform === "iPad" ? "iPad" : "iPhone"}`,
    android: "Android",
    web: "Web",
    default: "Unknown",
  });
  const osVersion = Platform.select({
    ios: Constants.platform?.ios?.systemVersion ?? "",
    android: Platform.Version ? `${Platform.Version}` : "",
    default: "",
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View className="pt-4 mb-6">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">APPEARANCE</Text>
          <SettingToggle
            icon={isDarkColorScheme ? "Moon" : "Sun"}
            title="Dark Mode"
            subtitle={isDarkColorScheme ? "Dark theme enabled" : "Light theme enabled"}
            value={isDarkColorScheme}
            onToggle={toggleColorScheme}
          />
        </View>

        {Platform.OS === "ios" && (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">PRIVACY</Text>
            <SettingItem
              icon="ShieldCheck"
              title="App Tracking"
              subtitle="Sync your tracking preference"
              onPress={() => router.push("/app-tracking?source=settings")}
            />
          </View>
        )}

        {/* Notifications Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            NOTIFICATIONS
          </Text>
          <SettingItem
            icon="Bell"
            title="Push Notifications"
            subtitle="Manage notification permissions"
            onPress={() => router.push("/onboarding-notifications?source=settings")}
          />
        </View>

        {/* About Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">ABOUT</Text>
          <SettingItem
            icon="Package"
            title="Version"
            subtitle={`${nativeVersion} (${nativeBuildVersion})`}
            showChevron={false}
          />
          <SettingItem
            icon="Code"
            title="Platform"
            subtitle={osVersion ? `${platformName} ${osVersion}` : platformName}
            showChevron={false}
          />
          <SettingItem
            icon="Smartphone"
            title="App Name"
            subtitle="BeaTrackFam: Loyalty Above All"
            showChevron={false}
          />
        </View>

        {/* Legal Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">LEGAL</Text>
          <SettingItem
            icon="FileText"
            title="Terms of Service"
            onPress={() => {
              WebBrowser.openBrowserAsync("https://beatrackfam.info/policies/terms-of-service");
            }}
          />
          <SettingItem
            icon="Shield"
            title="Privacy Policy"
            onPress={() => {
              WebBrowser.openBrowserAsync("https://beatrackfam.info/policies/privacy-policy");
            }}
          />
        </View>

        {/* Footer */}
        <View className="items-center py-8">
          <Text className="text-xs text-muted-foreground">© {currentYear} BeaTrackFam</Text>
          <Text className="text-xs text-muted-foreground">Loyalty Above All</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
