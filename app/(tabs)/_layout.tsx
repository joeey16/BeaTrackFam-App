import { Tabs } from "expo-router";
import LucideIcon from "~/lib/icons/LucideIcon";
import { useTheme } from "~/theming/ThemeProvider";
import { useCartContext } from "~/lib/contexts/CartContext";
import { useCart } from "~/lib/shopify/hooks";
import { View, Text, Platform, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeToggle } from "~/components/ThemeToggle";
import { router } from "expo-router";

function CartBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <View className="absolute -right-2 -top-1 h-5 w-5 items-center justify-center rounded-full bg-primary">
      <Text className="text-xs font-semibold text-primary-foreground">{count}</Text>
    </View>
  );
}

function BrandHeader() {
  const { theme } = useTheme();

  return (
    <Pressable onPress={() => router.push("/(tabs)")} className="flex-row items-center ml-4">
      <Image
        source={require("~/assets/icon.png")}
        style={{ width: 40, height: 40, borderRadius: 8 }}
        resizeMode="contain"
      />
      <View className="ml-3">
        <Text className="text-lg font-bold text-foreground">BeaTrackFam</Text>
        <Text className="text-xs text-muted-foreground">Loyalty Above All</Text>
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { theme } = useTheme();
  const { cartId } = useCartContext();
  const { data: cart } = useCart(cartId);
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          ...(Platform.OS === "android" && {
            elevation: 0,
            shadowOpacity: 0,
          }),
        },
        headerTintColor: theme.colors.foreground,
        headerTitle: "",
        headerLeft: () => <BrandHeader />,
        headerRight: () => (
          <View className="flex-row items-center gap-2 mr-4">
            {route.name === "index" && (
              <Pressable>
                <LucideIcon name="Menu" size={24} color={theme.colors.foreground} />
              </Pressable>
            )}
            <ThemeToggle />
          </View>
        ),
        headerStatusBarHeight: isAndroid ? insets.top : undefined,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          height: Platform.OS === "ios" ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.body?.fontFamily,
          fontSize: 11,
          fontWeight: "600" as any,
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "BeaTrackFam",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <LucideIcon name="House" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => <LucideIcon name="Heart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Shopping Cart",
          tabBarLabel: "Cart",
          tabBarIcon: ({ color, size }) => (
            <View>
              <LucideIcon name="ShoppingCart" size={size} color={color} />
              <CartBadge count={cart?.totalQuantity ?? 0} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => <LucideIcon name="User" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
