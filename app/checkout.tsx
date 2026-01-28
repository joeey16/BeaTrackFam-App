import * as React from "react";
import { View, ScrollView, ActivityIndicator, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useCartContext } from "~/lib/contexts/CartContext";
import { useCart } from "~/lib/shopify/hooks";
import { useTheme } from "~/theming/ThemeProvider";
import { router } from "expo-router";
import LucideIcon from "~/lib/icons/LucideIcon";
import { FontAwesome5 } from "@expo/vector-icons";
import { useStripe, usePlatformPay, PlatformPayButton, PlatformPay } from "~/lib/stripe";
function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}
export default function CheckoutScreen() {
  const { theme } = useTheme();
  const { cartId, clearCart } = useCartContext();
  const { data: cart, isLoading } = useCart(cartId);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();
  const [promoCode, setPromoCode] = React.useState("");
  const [backendHealthy, setBackendHealthy] = React.useState<boolean | null>(null);
  const [isProcessingCard, setIsProcessingCard] = React.useState(false);
  const [isProcessingWallet, setIsProcessingWallet] = React.useState(false);
  const [isPlatformPayReady, setIsPlatformPayReady] = React.useState(false);
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  const merchantCountryCode = "US";
  React.useEffect(() => {
    if (!backendUrl) {
      setBackendHealthy(false);
      return;
    }
    let isActive = true;
    const checkHealth = async () => {
      try {
        const response = await fetch(`${backendUrl}/health`);
        if (isActive) {
          setBackendHealthy(response.ok);
        }
      } catch (error) {
        if (isActive) {
          setBackendHealthy(false);
        }
      }
    };
    checkHealth();
    return () => {
      isActive = false;
    };
  }, [backendUrl]);
  React.useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }
    let isActive = true;
    const checkPlatformPay = async () => {
      try {
        const supported = await isPlatformPaySupported({
          googlePay: { testEnv: false },
        });
        if (isActive) {
          setIsPlatformPayReady(supported);
        }
      } catch (error) {
        if (isActive) {
          setIsPlatformPayReady(false);
        }
      }
    };
    checkPlatformPay();
    return () => {
      isActive = false;
    };
  }, [isPlatformPaySupported]);
  const buildLineItems = React.useCallback(() => {
    if (!cart) return [];
    return cart.lines.edges
      .map((edge) => ({
        merchandiseId: edge.node.merchandise.id,
        quantity: edge.node.quantity,
      }))
      .filter((item) => Boolean(item.merchandiseId));
  }, [cart]);
  const extractPaymentIntentId = (clientSecret: string) => {
    const [paymentIntentId] = clientSecret.split("_secret_");
    return paymentIntentId;
  };
  const createPaymentIntent = async () => {
    if (!backendUrl) {
      throw new Error("Missing backend URL. Please set EXPO_PUBLIC_BACKEND_URL.");
    }
    if (!cart) {
      throw new Error("Cart not available.");
    }
    const totalAmount = Number.parseFloat(cart.cost.totalAmount.amount);
    const amountInCents = Math.round(totalAmount * 100);
    const paymentResponse = await fetch(`${backendUrl}/payments/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountInCents,
        currency: cart.cost.totalAmount.currencyCode?.toLowerCase() || "usd",
        customerEmail: cart.buyerIdentity?.email || undefined,
        metadata: {
          cartId,
        },
      }),
    });
    const paymentData = await paymentResponse.json().catch(() => ({}));
    if (!paymentResponse.ok) {
      throw new Error(paymentData.error || "Failed to create payment intent");
    }
    return paymentData as { clientSecret: string };
  };
  const createShopifyOrder = async (paymentIntentId: string) => {
    if (!backendUrl) {
      throw new Error("Missing backend URL. Please set EXPO_PUBLIC_BACKEND_URL.");
    }
    if (!cart) {
      throw new Error("Cart not available.");
    }
    const orderResponse = await fetch(`${backendUrl}/shopify/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineItems: buildLineItems(),
        customerEmail: cart.buyerIdentity?.email || undefined,
        currency: cart.cost.totalAmount.currencyCode,
        transactionId: paymentIntentId,
        totalAmount: cart.cost.totalAmount.amount,
      }),
    });
    const orderData = await orderResponse.json().catch(() => ({}));
    if (!orderResponse.ok) {
      throw new Error(orderData.error || "Failed to create Shopify order");
    }
    return orderData;
  };
  const handleCardPayment = async () => {
    if (Platform.OS === "web") {
      return;
    }
    try {
      setIsProcessingCard(true);
      const { clientSecret } = await createPaymentIntent();
      const initResult = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "BeatRack Fam",
      });
      if (initResult.error) {
        throw new Error(initResult.error.message || "Failed to initialize payment sheet");
      }
      const paymentResult = await presentPaymentSheet();
      if (paymentResult.error) {
        throw new Error(paymentResult.error.message || "Payment failed");
      }
      const paymentIntentId = extractPaymentIntentId(clientSecret);
      await createShopifyOrder(paymentIntentId);
      await clearCart();
      router.replace("/(tabs)");
      Alert.alert("Success", "Payment complete! Your Shopify order is confirmed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment failed";
      Alert.alert("Error", message);
    } finally {
      setIsProcessingCard(false);
    }
  };
  const handlePlatformPay = async () => {
    if (Platform.OS === "web") {
      return;
    }
    try {
      setIsProcessingWallet(true);
      const { clientSecret } = await createPaymentIntent();
      const currencyCode = cart?.cost.totalAmount.currencyCode || "USD";
      const lineItems =
        cart?.lines.edges.map((edge) => ({
          label: edge.node.merchandise.title || "Item",
          amount: Number.parseFloat(edge.node.cost.totalAmount.amount).toFixed(2),
          type: PlatformPay.PaymentSummaryItemType.Final,
        })) || [];
      const totalItem = {
        label: "Total",
        amount: Number.parseFloat(cart?.cost.totalAmount.amount || "0").toFixed(2),
        type: PlatformPay.PaymentSummaryItemType.Final,
      };
      const { error } = await confirmPlatformPayPayment(clientSecret, {
        applePay: {
          cartItems: [...lineItems, totalItem],
          merchantCountryCode,
          currencyCode,
        },
        googlePay: {
          testEnv: false,
          merchantCountryCode,
          currencyCode,
        },
      });
      if (error) {
        throw new Error(error.message || "Wallet payment failed");
      }
      const paymentIntentId = extractPaymentIntentId(clientSecret);
      await createShopifyOrder(paymentIntentId);
      await clearCart();
      router.replace("/(tabs)");
      Alert.alert("Success", "Payment complete! Your Shopify order is confirmed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment failed";
      Alert.alert("Error", message);
    } finally {
      setIsProcessingWallet(false);
    }
  };
  const handleWebCheckout = () => {
    const checkoutUrl = cart?.checkoutUrl || "https://beatrackfam.info";
    if (typeof window !== "undefined") {
      window.location.href = checkoutUrl;
    }
  };
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  if (!cart || cart.lines.edges.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-h3 mb-2 text-center text-foreground">Your cart is empty</Text>
          <Button onPress={() => router.replace("/(tabs)")}>
            <Text>Continue Shopping</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }
  if (!backendUrl && Platform.OS !== "web") {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-h3 mb-2 text-center text-foreground">Backend not configured</Text>
          <Text className="text-center text-muted-foreground">
            Add EXPO_PUBLIC_BACKEND_URL to connect payments.
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  const paymentMethods =
    Platform.OS === "web"
      ? []
      : [
          {
            id: "apple-pay",
            label: "Apple Pay",
            type: "fa5" as const,
            icon: "apple-pay",
            color: "#111827",
          },
          {
            id: "google-pay",
            label: "Google Pay",
            type: "fa5" as const,
            icon: "google-pay",
            color: "#1A73E8",
          },
          {
            id: "card",
            label: "Credit/Debit",
            type: "fa5" as const,
            icon: "credit-card",
            color: "#111827",
          },
        ];
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <View className="flex-1">
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <Text className="text-h2 mb-6 font-bold text-foreground">Checkout</Text>
          <View className="mb-6 rounded-2xl bg-card p-4 border border-border">
            <View className="mb-3 flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <LucideIcon name="Shield" size={20} color={theme.colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">Secure Checkout</Text>
                <Text className="text-sm text-muted-foreground">
                  {Platform.OS === "web"
                    ? "Web checkout redirects to Shopify"
                    : backendHealthy === null
                      ? "Checking payment server..."
                      : backendHealthy
                        ? "Payment server connected"
                        : "Payment server unavailable"}
                </Text>
              </View>
            </View>
            <Text className="text-sm leading-5 text-muted-foreground">
              {Platform.OS === "web"
                ? "Complete your payment on Shopify’s secure checkout in a new tab."
                : "Pay securely in-app. We charge your card or wallet and then create the Shopify order automatically."}
            </Text>
          </View>
          <View className="mb-6 rounded-2xl bg-card p-4">
            <Text className="mb-3 text-lg font-semibold text-foreground">Order Summary</Text>
            <View className="mb-3 flex-row justify-between">
              <Text className="text-base text-muted-foreground">Items</Text>
              <Text className="text-base text-foreground">{cart.totalQuantity}</Text>
            </View>
            <View className="mb-3 flex-row justify-between">
              <Text className="text-base text-muted-foreground">Subtotal</Text>
              <Text className="text-base text-foreground">
                {formatPrice(
                  cart.cost.subtotalAmount.amount,
                  cart.cost.subtotalAmount.currencyCode,
                )}
              </Text>
            </View>
            {cart.cost.totalTaxAmount && (
              <View className="mb-3 flex-row justify-between">
                <Text className="text-base text-muted-foreground">Tax (estimated)</Text>
                <Text className="text-base text-foreground">
                  {formatPrice(
                    cart.cost.totalTaxAmount.amount,
                    cart.cost.totalTaxAmount.currencyCode,
                  )}
                </Text>
              </View>
            )}
            <View className="border-t border-border pt-3">
              <View className="flex-row justify-between">
                <Text className="text-lg font-semibold text-foreground">Total</Text>
                <Text className="text-xl font-bold text-primary">
                  {formatPrice(cart.cost.totalAmount.amount, cart.cost.totalAmount.currencyCode)}
                </Text>
              </View>
            </View>
          </View>
          <View className="mb-6 rounded-2xl bg-card p-4">
            <Text className="mb-3 text-lg font-semibold text-foreground">Promo Code</Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  autoCapitalize="characters"
                />
              </View>
              <Button size="sm" variant="secondary" disabled={!promoCode.trim()}>
                <Text>Apply</Text>
              </Button>
            </View>
            <Text className="mt-2 text-xs text-muted-foreground">
              {Platform.OS === "web"
                ? "Promo codes apply in Shopify checkout."
                : "Promo codes apply after payment when Shopify order is created."}
            </Text>
          </View>
          {Platform.OS !== "web" && (
            <View className="mb-6 rounded-2xl bg-muted p-4">
              <Text className="mb-2 text-sm font-semibold text-foreground">
                Accepted Payment Methods
              </Text>
              <View className="flex-row flex-wrap">
                {paymentMethods.map((method) => (
                  <View
                    key={method.id}
                    className="mr-2 mb-2 flex-row items-center rounded-lg bg-background px-3 py-2"
                  >
                    <FontAwesome5 name={method.icon} size={18} color={method.color} />
                    <Text className="ml-2 text-xs font-medium text-foreground">{method.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View className="h-32" />
        </ScrollView>
        <View className="border-t border-border bg-background px-4 py-4">
          {Platform.OS === "web" ? (
            <Button onPress={handleWebCheckout} className="w-full mb-2">
              <View className="flex-row items-center">
                <LucideIcon name="ExternalLink" size={20} color={theme.colors.primaryForeground} />
                <Text className="ml-2">Continue to Shopify Checkout</Text>
              </View>
            </Button>
          ) : (
            <>
              <Button
                onPress={handleCardPayment}
                className="w-full mb-2"
                disabled={isProcessingCard || isProcessingWallet || !backendHealthy}
              >
                <View className="flex-row items-center">
                  <LucideIcon name="CreditCard" size={20} color={theme.colors.primaryForeground} />
                  <Text className="ml-2">
                    {isProcessingCard ? "Processing card..." : "Pay with Card"}
                  </Text>
                </View>
              </Button>
              {isPlatformPayReady ? (
                <PlatformPayButton
                  type={PlatformPay.ButtonType.Pay}
                  appearance={PlatformPay.ButtonStyle.Black}
                  borderRadius={10}
                  onPress={handlePlatformPay}
                  disabled={isProcessingCard || isProcessingWallet || !backendHealthy}
                  style={{ height: 50 }}
                />
              ) : (
                <Button variant="secondary" className="w-full" disabled>
                  <Text>Apple Pay / Google Pay unavailable</Text>
                </Button>
              )}
            </>
          )}
          <Text className="text-center text-xs text-muted-foreground">
            By completing checkout, you agree to our terms and conditions
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
