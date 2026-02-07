import * as React from "react";
import {
  View,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useCustomer } from "~/lib/shopify/hooks";
import { useTheme } from "~/theming/ThemeProvider";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LucideIcon from "~/lib/icons/LucideIcon";

const PROFILE_PICTURE_KEY = "@beatrackfam:profile_picture";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

function MenuItem({ icon, title, onPress }: { icon: any; title: string; onPress: () => void }) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3 px-4 active:bg-muted rounded-xl"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10 mr-3">
        <LucideIcon name={icon} size={18} color={theme.colors.primary} />
      </View>
      <Text className="flex-1 text-base font-medium text-foreground">{title}</Text>
      <LucideIcon name="ChevronRight" size={18} color={theme.colors.mutedForeground} />
    </Pressable>
  );
}

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const { theme } = useTheme();
  const { accessToken, logout } = useAuth();
  const { data: customer } = useCustomer(accessToken);
  const [profilePicture, setProfilePicture] = React.useState<string | null>(null);
  const drawerWidth = SCREEN_WIDTH * 0.75;
  const slideAnim = React.useRef(new Animated.Value(-drawerWidth)).current;

  React.useEffect(() => {
    loadProfilePicture();
  }, []);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, drawerWidth]);

  const loadProfilePicture = async () => {
    try {
      const uri = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
      setProfilePicture(uri);
    } catch (error) {
      console.error("Failed to load profile picture:", error);
    }
  };

  const handleMenuItemPress = (action: () => void) => {
    onClose();
    setTimeout(action, 300);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
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
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 flex-row">
        {/* Drawer Content */}
        <Animated.View
          style={{
            width: drawerWidth,
            transform: [{ translateX: slideAnim }],
            backgroundColor: theme.colors.background,
          }}
          className="flex-1 shadow-2xl"
        >
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* User Profile Section */}
            {customer ? (
              <View className="px-4 pt-16 pb-6 border-b border-border">
                <Pressable
                  onPress={() => handleMenuItemPress(() => router.push("/my-profile"))}
                  className="flex-row items-center"
                >
                  {profilePicture ? (
                    <Image
                      key={profilePicture}
                      source={{ uri: profilePicture }}
                      style={{ width: 56, height: 56, borderRadius: 28 }}
                    />
                  ) : (
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: `${theme.colors.primary}20`,
                      }}
                    >
                      <LucideIcon name="User" size={26} color={theme.colors.primary} />
                    </View>
                  )}
                  <View className="ml-3 flex-1">
                    <Text className="text-lg font-bold text-foreground">
                      {customer.displayName}
                    </Text>
                    <Text className="text-sm text-muted-foreground">{customer.email}</Text>
                    <Text className="text-xs text-primary mt-1">View Profile →</Text>
                  </View>
                </Pressable>
              </View>
            ) : (
              <View className="px-4 pt-16 pb-6 border-b border-border">
                <Text className="text-base font-semibold text-foreground mb-3">
                  Welcome to BeaTrackFam
                </Text>
                <Text className="text-sm text-muted-foreground mb-4">
                  Sign in to access exclusive features
                </Text>
                <View className="flex-row gap-3">
                  <Button
                    onPress={() => handleMenuItemPress(() => router.push("/auth/login"))}
                    className="flex-1"
                  >
                    <Text>Log In</Text>
                  </Button>
                  <Button
                    onPress={() => handleMenuItemPress(() => router.push("/auth/signup"))}
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
              <MenuItem
                icon="House"
                title="Home"
                onPress={() => handleMenuItemPress(() => router.push("/(tabs)"))}
              />
              <MenuItem
                icon="Grid3x3"
                title="All Collections"
                onPress={() => handleMenuItemPress(() => router.push("/collections"))}
              />
              <MenuItem
                icon="Package"
                title="All Products"
                onPress={() => handleMenuItemPress(() => router.push("/products"))}
              />
              <MenuItem
                icon="Heart"
                title="Wishlist"
                onPress={() => handleMenuItemPress(() => router.push("/(tabs)/wishlist"))}
              />
              <MenuItem
                icon="ShoppingCart"
                title="Cart"
                onPress={() => handleMenuItemPress(() => router.push("/(tabs)/cart"))}
              />
            </View>

            {/* My Account Section */}
            {customer && (
              <View className="px-4 pt-2 pb-2">
                <Text className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                  MY ACCOUNT
                </Text>
                <MenuItem
                  icon="User"
                  title="My Profile"
                  onPress={() => handleMenuItemPress(() => router.push("/my-profile"))}
                />
                <MenuItem
                  icon="Package"
                  title="Order History"
                  onPress={() => handleMenuItemPress(() => router.push("/orders"))}
                />
                <MenuItem
                  icon="MapPin"
                  title="Addresses"
                  onPress={() => handleMenuItemPress(() => router.push("/addresses"))}
                />
              </View>
            )}

            {/* Services Section */}
            <View className="px-4 pt-2 pb-2">
              <Text className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                SERVICES
              </Text>
              <MenuItem
                icon="Palette"
                title="Custom Design Request"
                onPress={() => handleMenuItemPress(() => router.push("/custom-request"))}
              />
              <MenuItem
                icon="Headset"
                title="Support Center"
                onPress={() => handleMenuItemPress(() => router.push("/support"))}
              />
            </View>

            {/* Settings Section */}
            <View className="px-4 pt-2 pb-4">
              <Text className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                SETTINGS
              </Text>
              <MenuItem
                icon="Settings"
                title="App Settings"
                onPress={() => handleMenuItemPress(() => router.push("/settings"))}
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
              <Image
                source={require("~/assets/icon.png")}
                style={{ width: 56, height: 56, borderRadius: 12 }}
                resizeMode="contain"
                className="mb-3"
              />
              <Text className="text-base font-bold text-foreground">BeaTrackFam</Text>
              <Text className="text-xs text-muted-foreground mt-1">Loyalty Above All</Text>
              <Text className="text-xs text-muted-foreground mt-4">© 2025 BeaTrackFam</Text>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Overlay */}
        <Pressable className="flex-1" onPress={onClose}>
          <View
            className="flex-1"
            style={{ backgroundColor: theme.colors.overlay, opacity: 0.5 }}
          />
        </Pressable>
      </View>
    </Modal>
  );
}
