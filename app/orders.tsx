import * as React from "react";
import { View, ScrollView, Pressable, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useCustomerOrders } from "~/lib/shopify/hooks";
import { useTheme } from "~/theming/ThemeProvider";
import { router } from "expo-router";
import type { ShopifyOrder } from "~/lib/shopify/types";
import LucideIcon from "~/lib/icons/LucideIcon";
function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "fulfilled":
    case "paid":
      return "text-green-600";
    case "pending":
    case "authorized":
      return "text-yellow-600";
    case "cancelled":
    case "refunded":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}
function OrderCard({ order }: { order: ShopifyOrder }) {
  const { theme } = useTheme();
  return (
    <Pressable className="mb-4 rounded-2xl bg-card p-4">
      {/* Header */}
      <View className="mb-3 flex-row items-center justify-between border-b border-border pb-3">
        <View>
          <Text className="text-lg font-semibold text-foreground">{order.name}</Text>
          <Text className="text-sm text-muted-foreground">{formatDate(order.processedAt)}</Text>
        </View>
        <Text className="text-xl font-bold text-primary">
          {formatPrice(order.totalPrice.amount, order.totalPrice.currencyCode)}
        </Text>
      </View>
      {/* Status */}
      <View className="mb-3 flex-row items-center">
        <View className="mr-2 flex-row items-center rounded-lg bg-muted px-3 py-1">
          <LucideIcon
            name={order.fulfillmentStatus === "FULFILLED" ? "CircleCheck" : "Clock"}
            size={16}
            color={theme.colors.foreground}
          />
          <Text className={`ml-2 text-sm font-medium ${getStatusColor(order.fulfillmentStatus)}`}>
            {order.fulfillmentStatus}
          </Text>
        </View>
        <View className="flex-row items-center rounded-lg bg-muted px-3 py-1">
          <Text className={`text-sm font-medium ${getStatusColor(order.financialStatus)}`}>
            {order.financialStatus}
          </Text>
        </View>
      </View>
      {/* Items Preview */}
      <View className="mb-2">
        {order.lineItems.edges.slice(0, 2).map(({ node: item }) => (
          <View key={item.title} className="mb-3">
            <View className="mb-2 flex-row items-center">
              {item.variant?.image && (
                <Image
                  source={{ uri: item.variant.image.url }}
                  className="mr-3 h-12 w-12 rounded-lg"
                />
              )}
              <View className="flex-1">
                <Text className="text-sm text-foreground" numberOfLines={1}>
                  {item.title}
                </Text>
                {item.variant && (
                  <Text className="text-xs text-muted-foreground">
                    Qty: {item.quantity} ×{" "}
                    {formatPrice(item.variant.price.amount, item.variant.price.currencyCode)}
                  </Text>
                )}
              </View>
            </View>
            {/* Leave Review Button */}
            {order.fulfillmentStatus === "FULFILLED" && (
              <Pressable
                onPress={() => {
                  // TODO: Navigate to review screen or open review modal
                  console.log("Leave review for:", item.title);
                }}
                className="mt-1 flex-row items-center justify-center rounded-lg border border-border bg-background py-2"
              >
                <LucideIcon name="Star" size={14} color={theme.colors.primary} />
                <Text className="ml-2 text-xs font-medium text-primary">Leave a Review</Text>
              </Pressable>
            )}
          </View>
        ))}
        {order.lineItems.edges.length > 2 && (
          <Text className="text-xs text-muted-foreground">
            +{order.lineItems.edges.length - 2} more items
          </Text>
        )}
      </View>
      {/* Track Order Button */}
      {order.statusUrl && (
        <Pressable
          onPress={() => {
            // Open status URL in web view or browser
            console.log("Open order tracking:", order.statusUrl);
          }}
          className="mt-2 flex-row items-center justify-center rounded-lg border border-border bg-background py-2"
        >
          <Text className="mr-2 text-sm font-medium text-primary">Track Order</Text>
          <LucideIcon name="ExternalLink" size={16} color={theme.colors.primary} />
        </Pressable>
      )}
    </Pressable>
  );
}
export default function OrdersScreen() {
  const { theme } = useTheme();
  const { accessToken } = useAuth();
  const { data: orders, isLoading } = useCustomerOrders(accessToken, 20);
  if (!accessToken) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center px-6">
          <LucideIcon name="Package" size={64} color={theme.colors.mutedForeground} />
          <Text className="text-h3 mb-2 mt-6 text-center font-semibold text-foreground">
            Please Log In
          </Text>
          <Text className="mb-6 text-center text-muted-foreground">
            Log in to view your order history
          </Text>
          <Pressable
            onPress={() => router.push("/auth/login")}
            className="rounded-xl bg-primary px-6 py-3"
          >
            <Text className="font-semibold text-primary-foreground">Log In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  const isEmpty = !orders || orders.length === 0;
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="border-b border-border px-4 pt-4 pb-3">
          <Text className="text-h2 font-bold text-foreground">Order History</Text>
          {!isEmpty && (
            <Text className="mt-1 text-sm text-muted-foreground">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </Text>
          )}
        </View>
        {isEmpty ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="mb-6 h-32 w-32 items-center justify-center rounded-full bg-muted">
              <LucideIcon name="Package" size={64} color={theme.colors.mutedForeground} />
            </View>
            <Text className="text-h3 mb-2 text-center font-semibold text-foreground">
              No orders yet
            </Text>
            <Text className="mb-6 text-center text-muted-foreground">
              Your order history will appear here
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)")}
              className="rounded-xl bg-primary px-6 py-3"
            >
              <Text className="font-semibold text-primary-foreground">Start Shopping</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            <View className="h-8" />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
