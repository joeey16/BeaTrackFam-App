import * as React from "react";
import { View, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useCustomer, useCustomerOrders } from "~/lib/shopify/hooks";
import { useWishlist } from "~/lib/contexts/WishlistContext";
import { useTheme } from "~/theming/ThemeProvider";
import { router, Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LucideIcon from "~/lib/icons/LucideIcon";

const PROFILE_PICTURE_KEY = "@beatrackfam:profile_picture";

function StatCard({
  icon,
  value,
  label,
  onPress,
}: {
  icon: any;
  value: string | number;
  label: string;
  onPress?: () => void;
}) {
  const { theme } = useTheme();

  const content = (
    <View className="flex-1 items-center rounded-2xl bg-card p-4 border border-border">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
        <LucideIcon name={icon} size={24} color={theme.colors.primary} />
      </View>
      <Text className="text-2xl font-bold text-foreground mb-1">{value}</Text>
      <Text className="text-xs text-muted-foreground text-center">{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="flex-1">
        {content}
      </Pressable>
    );
  }

  return <View className="flex-1">{content}</View>;
}

export default function MyProfileScreen() {
  const { theme } = useTheme();
  const { accessToken } = useAuth();
  const { data: customer, isLoading } = useCustomer(accessToken);
  const { data: orders } = useCustomerOrders(accessToken, 100);
  const { wishlist } = useWishlist();
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
        <Stack.Screen options={{ title: "My Profile", headerBackTitle: "Back" }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
        <Stack.Screen options={{ title: "My Profile", headerBackTitle: "Back" }} />
        <View className="flex-1 items-center justify-center px-8">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-muted mb-4">
            <LucideIcon name="User" size={48} color={theme.colors.mutedForeground} />
          </View>
          <Text className="text-h3 mb-2 text-center font-semibold text-foreground">
            Please Log In
          </Text>
          <Text className="text-center text-muted-foreground mb-6">
            Sign in to view your profile
          </Text>
          <Button onPress={() => router.push("/auth/login")} size="lg">
            <Text>Log In</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const totalOrders = orders?.length || 0;
  const totalSpent =
    orders?.reduce((sum, order) => sum + parseFloat(order.totalPrice.amount), 0) || 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <Stack.Screen options={{ title: "My Profile", headerBackTitle: "Back" }} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="px-4 pt-6 pb-8" style={{ backgroundColor: theme.colors.primary }}>
          <View className="items-center">
            {profilePicture ? (
              <Image
                key={profilePicture}
                source={{ uri: profilePicture }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            ) : (
              <View
                className="items-center justify-center bg-background"
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                }}
              >
                <LucideIcon name="User" size={48} color={theme.colors.primary} />
              </View>
            )}
            <Text
              className="text-2xl font-bold mt-4 mb-1"
              style={{ color: theme.colors.primaryForeground }}
            >
              {customer.displayName}
            </Text>
            <Text
              className="text-sm mb-4"
              style={{ color: theme.colors.primaryForeground, opacity: 0.8 }}
            >
              {customer.email}
            </Text>
            <Button onPress={() => router.push("/profile")} variant="outline" size="sm">
              <View className="flex-row items-center">
                <LucideIcon name="Edit" size={16} color={theme.colors.primaryForeground} />
                <Text className="ml-2" style={{ color: theme.colors.primaryForeground }}>
                  Edit Profile
                </Text>
              </View>
            </Button>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="px-4 -mt-8 mb-6">
          <View className="flex-row gap-3">
            <StatCard
              icon="Package"
              value={totalOrders}
              label="Orders"
              onPress={() => router.push("/orders")}
            />
            <StatCard
              icon="Heart"
              value={wishlist.length}
              label="Wishlist"
              onPress={() => router.push("/(tabs)/wishlist")}
            />
            <StatCard icon="DollarSign" value={`$${totalSpent.toFixed(0)}`} label="Total Spent" />
          </View>
        </View>

        {/* Profile Details */}
        <View className="px-4 mb-6">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            PROFILE INFORMATION
          </Text>

          <View className="rounded-2xl bg-card p-4 mb-3 border border-border">
            <View className="flex-row items-center mb-3">
              <LucideIcon name="User" size={18} color={theme.colors.mutedForeground} />
              <Text className="ml-3 text-sm font-medium text-muted-foreground">Name</Text>
            </View>
            <Text className="text-base text-foreground">
              {customer.firstName} {customer.lastName}
            </Text>
          </View>

          <View className="rounded-2xl bg-card p-4 mb-3 border border-border">
            <View className="flex-row items-center mb-3">
              <LucideIcon name="Mail" size={18} color={theme.colors.mutedForeground} />
              <Text className="ml-3 text-sm font-medium text-muted-foreground">Email</Text>
            </View>
            <Text className="text-base text-foreground">{customer.email}</Text>
          </View>

          {customer.phone && (
            <View className="rounded-2xl bg-card p-4 mb-3 border border-border">
              <View className="flex-row items-center mb-3">
                <LucideIcon name="Phone" size={18} color={theme.colors.mutedForeground} />
                <Text className="ml-3 text-sm font-medium text-muted-foreground">Phone</Text>
              </View>
              <Text className="text-base text-foreground">{customer.phone}</Text>
            </View>
          )}

          {customer.defaultAddress && (
            <View className="rounded-2xl bg-card p-4 border border-border">
              <View className="flex-row items-center mb-3">
                <LucideIcon name="MapPin" size={18} color={theme.colors.mutedForeground} />
                <Text className="ml-3 text-sm font-medium text-muted-foreground">
                  Default Address
                </Text>
              </View>
              <Text className="text-base text-foreground">
                {customer.defaultAddress.address1}
                {customer.defaultAddress.address2 ? `, ${customer.defaultAddress.address2}` : ""}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {customer.defaultAddress.city}, {customer.defaultAddress.province}{" "}
                {customer.defaultAddress.zip}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {customer.defaultAddress.country}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-4 mb-8">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            QUICK ACTIONS
          </Text>
          <Button onPress={() => router.push("/orders")} variant="outline" className="mb-3">
            <View className="flex-row items-center">
              <LucideIcon name="Package" size={18} color={theme.colors.foreground} />
              <Text className="ml-2 text-foreground">View Order History</Text>
            </View>
          </Button>
          <Button onPress={() => router.push("/addresses")} variant="outline" className="mb-3">
            <View className="flex-row items-center">
              <LucideIcon name="MapPin" size={18} color={theme.colors.foreground} />
              <Text className="ml-2 text-foreground">Manage Addresses</Text>
            </View>
          </Button>
          <Button onPress={() => router.push("/custom-request")} variant="outline">
            <View className="flex-row items-center">
              <LucideIcon name="Palette" size={18} color={theme.colors.foreground} />
              <Text className="ml-2 text-foreground">Request Custom Design</Text>
            </View>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
