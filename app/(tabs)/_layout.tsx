import { Tabs } from "expo-router";
import LucideIcon from "~/lib/icons/LucideIcon";
import { useTheme } from "~/theming/ThemeProvider";
import { useCartContext } from "~/lib/contexts/CartContext";
import { useCart } from "~/lib/shopify/hooks";
import { View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeToggle } from "~/components/ThemeToggle";

function CartBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <View className="absolute -right-2 -top-1 h-5 w-5 items-center justify-center rounded-full bg-primary">
      <Text className="text-xs font-semibold text-primary-foreground">{count}</Text>
    </View>
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
      screenOptions={{
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
        headerTitleStyle: {
          fontFamily: theme.typography.h2?.fontFamily,
          fontSize: 20,
        },
        headerRight: () => <ThemeToggle />,
        headerStatusBarHeight: isAndroid ? insets.top : undefined,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.body?.fontFamily,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "BeaTrackFam",
          tabBarLabel: "Shop",
          tabBarIcon: ({ color, size }) => <LucideIcon name="Store" size={size} color={color} />,
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
