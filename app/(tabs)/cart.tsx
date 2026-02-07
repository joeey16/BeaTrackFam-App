import * as React from "react";
import { View, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useCartContext } from "~/lib/contexts/CartContext";
import { useCart, useUpdateCartLine, useRemoveFromCart } from "~/lib/shopify/hooks";
import LucideIcon from "~/lib/icons/LucideIcon";
import { useTheme } from "~/theming/ThemeProvider";
import { router } from "expo-router";
import type { ShopifyCartLine } from "~/lib/shopify/types";
function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}
function CartLineItem({ line, cartId }: { line: ShopifyCartLine; cartId: string }) {
  const { theme } = useTheme();
  const updateLine = useUpdateCartLine();
  const removeLine = useRemoveFromCart();
  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity < 1) return;
    updateLine.mutate({ cartId, lineId: line.id, quantity: newQuantity });
  };
  const handleRemove = () => {
    removeLine.mutate({ cartId, lineIds: [line.id] });
  };
  // Access product info through merchandise
  const variant = line.merchandise;
  const productTitle =
    "product" in variant && variant.product ? (variant.product as any).title : "Product";
  const compareAtPrice = variant.compareAtPrice;
  const isOnSale =
    !!compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(variant.price.amount);

  const lineTotal = parseFloat(variant.price.amount) * line.quantity;

  return (
    <View className="mb-3 flex-row rounded-2xl bg-card p-3 border border-border">
      {variant.image && (
        <Image
          source={{ uri: variant.image.url }}
          className="h-20 w-20 rounded-lg bg-muted"
          resizeMode="cover"
        />
      )}
      <View className="ml-3 flex-1">
        <View className="flex-row items-start justify-between mb-1">
          <Text className="text-sm font-semibold text-foreground flex-1" numberOfLines={2}>
            {productTitle}
          </Text>
          <Pressable onPress={handleRemove} disabled={removeLine.isPending} className="ml-2">
            <LucideIcon name="Trash2" size={18} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>

        {variant.title !== "Default Title" && (
          <Text className="text-xs text-muted-foreground mb-2">{variant.title}</Text>
        )}

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 bg-muted rounded-lg px-1 py-1">
            <Pressable
              onPress={() => handleUpdateQuantity(line.quantity - 1)}
              className="h-7 w-7 items-center justify-center"
              disabled={updateLine.isPending || line.quantity <= 1}
            >
              <LucideIcon name="Minus" size={14} color={theme.colors.foreground} />
            </Pressable>
            <Text className="text-sm font-medium text-foreground min-w-6 text-center">
              {line.quantity}
            </Text>
            <Pressable
              onPress={() => handleUpdateQuantity(line.quantity + 1)}
              className="h-7 w-7 items-center justify-center"
              disabled={updateLine.isPending}
            >
              <LucideIcon name="Plus" size={14} color={theme.colors.foreground} />
            </Pressable>
          </View>

          <Text className="text-base font-bold text-foreground">
            {formatPrice(lineTotal.toFixed(2), variant.price.currencyCode)}
          </Text>
        </View>
      </View>
    </View>
  );
}
export default function CartScreen() {
  const { theme } = useTheme();
  const { cartId } = useCartContext();
  const { data: cart, isLoading } = useCart(cartId);
  const handleCheckout = () => {
    router.push("/checkout");
  };
  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }
  const lines = cart?.lines?.edges ?? [];
  const isEmpty = lines.length === 0;
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        {isEmpty ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="h-32 w-32 items-center justify-center rounded-full bg-muted mb-6">
              <LucideIcon name="ShoppingCart" size={64} color={theme.colors.mutedForeground} />
            </View>
            <Text className="text-h3 mb-2 text-center font-semibold text-foreground">
              Your cart is empty
            </Text>
            <Text className="mb-6 text-center text-muted-foreground">
              Add some items to get started
            </Text>
            <Button onPress={() => router.push("/(tabs)")}>
              <Text>Start Shopping</Text>
            </Button>
          </View>
        ) : (
          <>
            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
              {lines.map(({ node }) => (
                <CartLineItem key={node.id} line={node} cartId={cart.id} />
              ))}
              {/* Spacer for bottom button */}
              <View className="h-32" />
            </ScrollView>
            {/* Checkout Section */}
            <View className="border-t border-border bg-background px-4 py-4">
              {cart?.cost && (
                <>
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-sm text-muted-foreground">Subtotal</Text>
                    <Text className="text-sm font-medium text-foreground">
                      {formatPrice(
                        cart.cost.subtotalAmount.amount,
                        cart.cost.subtotalAmount.currencyCode,
                      )}
                    </Text>
                  </View>
                  {cart.cost.totalTaxAmount && (
                    <View className="mb-3 flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">Tax</Text>
                      <Text className="text-sm font-medium text-foreground">
                        {formatPrice(
                          cart.cost.totalTaxAmount.amount,
                          cart.cost.totalTaxAmount.currencyCode,
                        )}
                      </Text>
                    </View>
                  )}
                  <View className="mb-4 pt-3 border-t border-border flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-foreground">Total</Text>
                    <Text className="text-xl font-bold text-foreground">
                      {formatPrice(
                        cart.cost.totalAmount.amount,
                        cart.cost.totalAmount.currencyCode,
                      )}
                    </Text>
                  </View>
                </>
              )}
              <Button onPress={handleCheckout} size="lg" className="w-full">
                <Text>Proceed to Checkout</Text>
              </Button>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
