import * as React from "react";
import { View, ScrollView, Pressable, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useCustomer } from "~/lib/shopify/hooks";
import { useTheme } from "~/theming/ThemeProvider";
import { router, Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LucideIcon from "~/lib/icons/LucideIcon";

const PROFILE_PICTURE_KEY = "@beatrackfam:profile_picture";

function MenuItem({
  icon,
  title,
  onPress,
  badge,
}: {
  icon: any;
  title: string;
  onPress: () => void;
  badge?: string | number;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-4 px-4 active:bg-muted rounded-xl"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10 mr-4">
        <LucideIcon name={icon} size={20} color={theme.colors.primary} />
      </View>
      <Text className="flex-1 text-base font-medium text-foreground">{title}</Text>
      {badge !== undefined && (
        <View className="bg-primary px-2 py-1 rounded-full ml-2">
          <Text className="text-xs font-semibold text-primary-foreground">{badge}</Text>
        </View>
      )}
      <LucideIcon name="ChevronRight" size={20} color={theme.colors.mutedForeground} />
    </Pressable>
  );
}

export default function MenuScreen() {
  const { theme } = useTheme();
  const { accessToken, logout } = useAuth();
  const { data: customer } = useCustomer(accessToken);
  const [profilePicture, setProfilePicture] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadProfilePicture();
  }, []);

  const loadProfilePicture = async () => {
    try {
      const uri = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
      setProfilePicture(uri);
    } catch (error) {
      console.error("Failed to load profile picture:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <Stack.Screen options={{ title: "Menu", headerBackTitle: "Close" }} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        {customer ? (
          <View className="px-4 pt-6 pb-6 border-b border-border">
            <Pressable onPress={() => router.push("/my-profile")} className="flex-row items-center">
              {profilePicture ? (
                <Image
                  key={profilePicture}
                  source={{ uri: profilePicture }}
                  style={{ width: 60, height: 60, borderRadius: 30 }}
                />
              ) : (
                <View
                  className="items-center justify-center"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: `${theme.colors.primary}20`,
                  }}
                >
                  <LucideIcon name="User" size={28} color={theme.colors.primary} />
                </View>
              )}
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-foreground">{customer.displayName}</Text>
                <Text className="text-sm text-muted-foreground">{customer.email}</Text>
                <Text className="text-xs text-primary mt-1">View Profile →</Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <View className="px-4 pt-6 pb-6 border-b border-border">
            <Text className="text-base font-semibold text-foreground mb-3">
              Welcome to BeaTrackFam
            </Text>
            <Text className="text-sm text-muted-foreground mb-4">
              Sign in to access exclusive features
            </Text>
            <View className="flex-row gap-3">
              <Button onPress={() => router.push("/auth/login")} className="flex-1">
                <Text>Log In</Text>
              </Button>
              <Button
                onPress={() => router.push("/auth/signup")}
                variant="outline"
                className="flex-1"
              >
                <Text className="text-foreground">Sign Up</Text>
              </Button>
            </View>
          </View>
        )}

        {/* Shop Section */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-xs font-semibold text-muted-foreground mb-2 px-1">SHOP</Text>
          <MenuItem icon="House" title="Home" onPress={() => router.push("/(tabs)")} />
          <MenuItem
            icon="Grid3x3"
            title="All Collections"
            onPress={() => router.push("/collections")}
          />
          <MenuItem icon="Package" title="All Products" onPress={() => router.push("/products")} />
          <MenuItem icon="Heart" title="Wishlist" onPress={() => router.push("/(tabs)/wishlist")} />
          <MenuItem icon="ShoppingCart" title="Cart" onPress={() => router.push("/(tabs)/cart")} />
        </View>

        {/* My Account Section */}
        {customer && (
          <View className="px-4 pt-2 pb-2">
            <Text className="text-xs font-semibold text-muted-foreground mb-2 px-1">
              MY ACCOUNT
            </Text>
            <MenuItem icon="User" title="My Profile" onPress={() => router.push("/my-profile")} />
            <MenuItem icon="Package" title="Order History" onPress={() => router.push("/orders")} />
            <MenuItem icon="MapPin" title="Addresses" onPress={() => router.push("/addresses")} />
          </View>
        )}

        {/* Services Section */}
        <View className="px-4 pt-2 pb-2">
          <Text className="text-xs font-semibold text-muted-foreground mb-2 px-1">SERVICES</Text>
          <MenuItem
            icon="Palette"
            title="Custom Design Request"
            onPress={() => router.push("/custom-request")}
          />
          <MenuItem icon="Headset" title="Support Center" onPress={() => router.push("/support")} />
        </View>

        {/* Settings Section */}
        <View className="px-4 pt-2 pb-4">
          <Text className="text-xs font-semibold text-muted-foreground mb-2 px-1">SETTINGS</Text>
          <MenuItem icon="Settings" title="App Settings" onPress={() => router.push("/settings")} />
          <MenuItem
            icon="Share2"
            title="Share App"
            onPress={() => {
              // Share functionality
              router.back();
            }}
          />
        </View>

        {/* Logout */}
        {customer && (
          <View className="px-4 pb-8">
            <Button onPress={handleLogout} variant="outline">
              <View className="flex-row items-center">
                <LucideIcon name="LogOut" size={18} color={theme.colors.foreground} />
                <Text className="ml-2 text-foreground">Log Out</Text>
              </View>
            </Button>
          </View>
        )}

        {/* App Info */}
        <View className="px-4 pb-8 items-center border-t border-border pt-6">
          <View
            className="h-16 w-16 items-center justify-center rounded-full mb-3"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Text className="text-2xl font-bold" style={{ color: theme.colors.primaryForeground }}>
              B
            </Text>
          </View>
          <Text className="text-base font-bold text-foreground">BeaTrackFam</Text>
          <Text className="text-xs text-muted-foreground mt-1">Loyalty Above All</Text>
          <Text className="text-xs text-muted-foreground mt-4">© 2025 BeaTrackFam</Text>
          <Text className="text-xs text-muted-foreground">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
