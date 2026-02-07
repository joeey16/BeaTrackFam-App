import * as React from "react";
import { View, ScrollView, ActivityIndicator, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { useCartContext } from "~/lib/contexts/CartContext";
import { useCart, useCartDiscountCodesUpdate } from "~/lib/shopify/hooks";
import { router } from "expo-router";
import LucideIcon from "~/lib/icons/LucideIcon";
import { FontAwesome5 } from "@expo/vector-icons";
import { useStripe, usePlatformPay, PlatformPayButton, PlatformPay } from "~/lib/stripe";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useCustomer } from "~/lib/shopify/hooks";

type ShippingOption = {
  id: string;
  label: string;
  amount: number;
};

type DiscountCode = {
  code: string;
  valueType: "percentage" | "fixed_amount";
  value: number;
};
function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

type ContactForm = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
};

type AddressForm = {
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};
export default function CheckoutScreen() {
  const primaryColor = "#4F46E5";
  const primaryForeground = "#FFFFFF";
  const shippingOptions: ShippingOption[] = [
    { id: "standard", label: "Standard", amount: 6.99 },
    { id: "expedited", label: "Expedited", amount: 16.99 },
    { id: "premium", label: "Premium", amount: 29.99 },
  ];
  const { cartId, clearCart } = useCartContext();
  const { data: cart, isLoading } = useCart(cartId);
  const cartDiscountCodesUpdate = useCartDiscountCodesUpdate();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();
  const { accessToken } = useAuth();
  const { data: customer } = useCustomer(accessToken);
  const [promoCode, setPromoCode] = React.useState("");
  const [availableDiscounts, setAvailableDiscounts] = React.useState<DiscountCode[]>([]);
  const [appliedDiscount, setAppliedDiscount] = React.useState<DiscountCode | null>(null);
  const [discountAmountOverride, setDiscountAmountOverride] = React.useState<number | null>(null);
  const [backendHealthy, setBackendHealthy] = React.useState<boolean | null>(null);
  const [isProcessingCard, setIsProcessingCard] = React.useState(false);
  const [isProcessingWallet, setIsProcessingWallet] = React.useState(false);
  const [isApplyingPromo, setIsApplyingPromo] = React.useState(false);
  const [isPlatformPayReady, setIsPlatformPayReady] = React.useState(false);
  const [useSavedPaymentMethods, setUseSavedPaymentMethods] = React.useState(true);
  const [contact, setContact] = React.useState<ContactForm>({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
  });
  const [shipping, setShipping] = React.useState<AddressForm>({
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = React.useState(true);
  const [billing, setBilling] = React.useState<AddressForm>({
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [selectedShippingId, setSelectedShippingId] = React.useState("standard");
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  const merchantCountryCode = "US";
  React.useEffect(() => {
    if (!customer) return;
    setContact((prev) => ({
      email: prev.email || customer.email || "",
      phone: prev.phone || customer.phone || "",
      firstName: prev.firstName || customer.firstName || "",
      lastName: prev.lastName || customer.lastName || "",
    }));
    if (customer.defaultAddress && !shipping.address1) {
      setShipping((prev) => ({
        ...prev,
        address1: customer.defaultAddress?.address1 || prev.address1,
        address2: customer.defaultAddress?.address2 || prev.address2,
        city: customer.defaultAddress?.city || prev.city,
        state: customer.defaultAddress?.province || prev.state,
        postalCode: customer.defaultAddress?.zip || prev.postalCode,
        country: customer.defaultAddress?.countryCodeV2 || prev.country,
      }));
    }
  }, [customer, shipping.address1]);
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
    if (!backendUrl) return;
    let isActive = true;
    const loadDiscountCodes = async () => {
      try {
        const response = await fetch(`${backendUrl}/shopify/discount-codes`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          return;
        }
        if (isActive && Array.isArray(data.codes)) {
          setAvailableDiscounts(
            data.codes
              .filter((code) => code.code)
              .map((code) => ({
                code: String(code.code).toUpperCase(),
                valueType: code.valueType,
                value: Number(code.value),
              })),
          );
        }
      } catch (error) {
        // ignore for now
      }
    };
    loadDiscountCodes();
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
  React.useEffect(() => {
    if (billingSameAsShipping) {
      setBilling(shipping);
    }
  }, [billingSameAsShipping, shipping]);

  React.useEffect(() => {
    if (!appliedDiscount) {
      setDiscountAmountOverride(null);
      return;
    }
    const cartTotalAmount = Number.parseFloat(cart?.cost.totalAmount.amount || "0");
    const computed = Math.max(subtotalAmount + taxAmount - cartTotalAmount, 0);
    setDiscountAmountOverride(computed > 0 ? computed : null);
  }, [appliedDiscount, cart?.cost.totalAmount.amount, subtotalAmount, taxAmount]);
  const buildLineItems = React.useCallback(() => {
    if (!cart) return [];
    return cart.lines.edges
      .map((edge) => ({
        variantId: edge.node.merchandise.id,
        quantity: edge.node.quantity,
      }))
      .filter((item) => Boolean(item.variantId));
  }, [cart]);
  const selectedShipping = shippingOptions.find((option) => option.id === selectedShippingId);
  const shippingAmount = selectedShipping?.amount ?? 0;
  const subtotalAmount = Number.parseFloat(cart?.cost.subtotalAmount.amount || "0");
  const taxAmount = Number.parseFloat(cart?.cost.totalTaxAmount?.amount || "0");
  const totalBeforeDiscount = subtotalAmount + taxAmount + shippingAmount;
  const rawDiscountAmount =
    appliedDiscount?.valueType === "percentage"
      ? Number((subtotalAmount * (appliedDiscount.value / 100)).toFixed(2))
      : appliedDiscount?.value
        ? Number(appliedDiscount.value.toFixed(2))
        : 0;
  const cartTotalAmount = Number.parseFloat(cart?.cost.totalAmount.amount || "0");
  const cartComputedDiscount = appliedDiscount
    ? Math.max(subtotalAmount + taxAmount - cartTotalAmount, 0)
    : 0;
  const effectiveDiscountAmount =
    discountAmountOverride !== null && discountAmountOverride > 0
      ? discountAmountOverride
      : cartComputedDiscount > 0
        ? cartComputedDiscount
        : rawDiscountAmount;
  const discountAmount = Math.min(effectiveDiscountAmount, totalBeforeDiscount);
  const totalAfterDiscount = Math.max(totalBeforeDiscount - discountAmount, 0);
  const extractPaymentIntentId = (clientSecret: string) => {
    const [paymentIntentId] = clientSecret.split("_secret_");
    return paymentIntentId;
  };
  const validateCheckoutForm = () => {
    const requiredContact =
      contact.email.trim() &&
      contact.phone.trim() &&
      contact.firstName.trim() &&
      contact.lastName.trim();
    const requiredShipping =
      shipping.address1.trim() &&
      shipping.city.trim() &&
      shipping.state.trim() &&
      shipping.postalCode.trim() &&
      shipping.country.trim();
    const requiredBilling =
      billingSameAsShipping ||
      (billing.address1.trim() &&
        billing.city.trim() &&
        billing.state.trim() &&
        billing.postalCode.trim() &&
        billing.country.trim());

    if (!requiredContact) {
      Alert.alert("Missing info", "Please complete all contact fields.");
      return false;
    }
    if (!requiredShipping) {
      Alert.alert("Missing info", "Please complete all required shipping fields.");
      return false;
    }
    if (!requiredBilling) {
      Alert.alert("Missing info", "Please complete all required billing fields.");
      return false;
    }
    return true;
  };
  const applyPromoCode = async () => {
    const normalized = promoCode.trim().toUpperCase();
    if (!normalized) return;
    if (!cartId || !cart) {
      Alert.alert("Cart unavailable", "Please try again once your cart is ready.");
      return;
    }
    const match = availableDiscounts.find((code) => code.code === normalized) || null;
    const previousSubtotal = subtotalAmount;
    try {
      setIsApplyingPromo(true);
      const updatedCart = await cartDiscountCodesUpdate.mutateAsync({
        cartId,
        discountCodes: [normalized],
      });
      const refreshedSubtotal = Number.parseFloat(
        updatedCart.cost.subtotalAmount.amount || previousSubtotal.toString(),
      );
      const appliedAmount = Math.max(previousSubtotal - refreshedSubtotal, 0);
      const applied = updatedCart.discountCodes?.find((code) => code.code === normalized);
      if (applied && !applied.applicable) {
        throw new Error("That discount code isn't applicable to this cart.");
      }
      setAppliedDiscount(
        match ?? {
          code: normalized,
          valueType: "fixed_amount",
          value: appliedAmount,
        },
      );
      Alert.alert("Discount applied", `${normalized} has been applied to your order.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to apply discount code.";
      setAppliedDiscount(null);
      setDiscountAmountOverride(null);
      Alert.alert("Invalid code", message);
    } finally {
      setIsApplyingPromo(false);
    }
  };
  const createPaymentIntent = async (withCustomer: boolean) => {
    if (!backendUrl) {
      throw new Error("Missing backend URL. Please set EXPO_PUBLIC_BACKEND_URL.");
    }
    if (!cart) {
      throw new Error("Cart not available.");
    }
    const amountInCents = Math.round(totalAfterDiscount * 100);
    const endpoint = withCustomer ? "/payments/init-payment-sheet" : "/payments/create-intent";
    const paymentResponse = await fetch(`${backendUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountInCents,
        currency: cart.cost.totalAmount.currencyCode?.toLowerCase() || "usd",
        customerEmail: contact.email || undefined,
        metadata: {
          cartId,
          customerName: `${contact.firstName} ${contact.lastName}`.trim(),
          customerPhone: contact.phone,
          shippingAddress: JSON.stringify(shipping),
          billingAddress: JSON.stringify(billingSameAsShipping ? shipping : billing),
          shippingMethod: selectedShipping?.label,
          shippingAmount: shippingAmount.toFixed(2),
          discountCode: appliedDiscount?.code || "",
          discountAmount: discountAmount.toFixed(2),
        },
      }),
    });
    const paymentData = await paymentResponse.json().catch(() => ({}));
    if (!paymentResponse.ok) {
      throw new Error(paymentData.error || "Failed to create payment intent");
    }
    return paymentData as { clientSecret: string; customerId?: string; ephemeralKey?: string };
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
        customerEmail: contact.email || undefined,
        customerName: `${contact.firstName} ${contact.lastName}`.trim(),
        customerPhone: contact.phone,
        shippingAddress: shipping,
        billingAddress: billingSameAsShipping ? shipping : billing,
        shippingLine: selectedShipping
          ? {
              title: selectedShipping.label,
              code: selectedShipping.id,
              price: shippingAmount.toFixed(2),
            }
          : undefined,
        discountCode: appliedDiscount?.code || undefined,
        discountAmount: appliedDiscount ? discountAmount.toFixed(2) : undefined,
        discountType: appliedDiscount?.valueType || undefined,
        currency: cart.cost.totalAmount.currencyCode,
        transactionId: paymentIntentId,
        totalAmount: totalAfterDiscount.toFixed(2),
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
      if (!validateCheckoutForm()) {
        return;
      }
      setIsProcessingCard(true);
      const shouldUseCustomer = useSavedPaymentMethods && Boolean(contact.email);
      const { clientSecret, customerId, ephemeralKey } =
        await createPaymentIntent(shouldUseCustomer);
      const initResult = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "BeaTrackFam Inc",
        customerId: customerId,
        customerEphemeralKeySecret: ephemeralKey,
        allowsDelayedPaymentMethods: true,
        returnURL: "beatrackfaminc://stripe-redirect",
      });
      if (initResult.error) {
        throw new Error(initResult.error.message || "Failed to initialize payment sheet");
      }
      const paymentResult = await presentPaymentSheet();
      if (paymentResult.error) {
        throw new Error(paymentResult.error.message || "Payment failed");
      }
      const paymentIntentId = extractPaymentIntentId(clientSecret);
      const order = await createShopifyOrder(paymentIntentId);
      await clearCart();
      const formattedTotal = formatPrice(
        totalAfterDiscount.toFixed(2),
        cart.cost.totalAmount.currencyCode,
      );
      router.replace({
        pathname: "/thankyou",
        params: {
          orderNumber: order.orderNumber ? String(order.orderNumber) : undefined,
          total: formattedTotal,
        },
      });
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
      if (!validateCheckoutForm()) {
        return;
      }
      setIsProcessingWallet(true);
      const { clientSecret } = await createPaymentIntent(false);
      const currencyCode = cart?.cost.totalAmount.currencyCode || "USD";
      const paymentSummaryItemTypeImmediate = PlatformPay.PaymentType.Immediate;

      const lineItems =
        cart?.lines.edges.map((edge) => ({
          label: edge.node.merchandise.title || "Item",
          amount: Number.parseFloat(edge.node.cost.totalAmount.amount).toFixed(2),
          paymentType: paymentSummaryItemTypeImmediate,
        })) || [];
      if (cart?.cost.totalTaxAmount) {
        lineItems.push({
          label: "Tax",
          amount: Number.parseFloat(cart.cost.totalTaxAmount.amount).toFixed(2),
          paymentType: paymentSummaryItemTypeImmediate,
        });
      }
      if (selectedShipping) {
        lineItems.push({
          label: `${selectedShipping.label} Shipping`,
          amount: shippingAmount.toFixed(2),
          paymentType: paymentSummaryItemTypeImmediate,
        });
      }
      if (appliedDiscount && discountAmount > 0) {
        lineItems.push({
          label: `${appliedDiscount.code} Discount`,
          amount: (-discountAmount).toFixed(2),
          paymentType: paymentSummaryItemTypeImmediate,
        });
      }
      const totalItem = {
        label: "BeaTrackFam Inc",
        amount: totalAfterDiscount.toFixed(2),
        paymentType: paymentSummaryItemTypeImmediate,
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
      const order = await createShopifyOrder(paymentIntentId);
      await clearCart();
      const formattedTotal = formatPrice(
        totalAfterDiscount.toFixed(2),
        cart.cost.totalAmount.currencyCode,
      );
      router.replace({
        pathname: "/thankyou",
        params: {
          orderNumber: order.orderNumber ? String(order.orderNumber) : undefined,
          total: formattedTotal,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment failed";
      Alert.alert("Error", message);
    } finally {
      setIsProcessingWallet(false);
    }
  };
  const handleShopifyCheckout = async () => {
    if (!validateCheckoutForm()) {
      return;
    }
    const checkoutUrl = cart?.checkoutUrl || "https://beatrackfam.info";
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.location.href = checkoutUrl;
      }
      return;
    }
    await WebBrowser.openBrowserAsync(checkoutUrl);
  };
  const handleSelectSavedAddress = (address: {
    firstName: string;
    lastName: string;
    address1: string;
    address2: string | null;
    city: string;
    province: string | null;
    zip: string;
    countryCodeV2: string;
    phone: string | null;
  }) => {
    setShipping({
      address1: address.address1 || "",
      address2: address.address2 || "",
      city: address.city || "",
      state: address.province || "",
      postalCode: address.zip || "",
      country: address.countryCodeV2 || "US",
    });
    if (billingSameAsShipping) {
      setBilling({
        address1: address.address1 || "",
        address2: address.address2 || "",
        city: address.city || "",
        state: address.province || "",
        postalCode: address.zip || "",
        country: address.countryCodeV2 || "US",
      });
    }
    setContact((prev) => ({
      email: prev.email,
      phone: prev.phone || address.phone || "",
      firstName: prev.firstName || address.firstName || "",
      lastName: prev.lastName || address.lastName || "",
    }));
  };
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
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
            id: "shop-pay",
            label: "Shop Pay",
            type: "fa5" as const,
            icon: "shopify",
            color: "#5A31F4",
          },
          {
            id: "paypal",
            label: "PayPal",
            type: "fa5" as const,
            icon: "cc-paypal",
            color: "#0070BA",
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
                <LucideIcon name="Shield" size={20} color={primaryColor} />
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
            <Text className="mb-4 text-lg font-semibold text-foreground">Contact Info</Text>
            <View className="mb-3">
              <Label>Email</Label>
              <Input
                keyboardType="email-address"
                autoCapitalize="none"
                value={contact.email}
                onChangeText={(value) => setContact((prev) => ({ ...prev, email: value }))}
                placeholder="you@email.com"
              />
            </View>
            <View className="mb-3">
              <Label>Phone</Label>
              <Input
                keyboardType="phone-pad"
                value={contact.phone}
                onChangeText={(value) => setContact((prev) => ({ ...prev, phone: value }))}
                placeholder="(555) 123-4567"
              />
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Label>First name</Label>
                <Input
                  value={contact.firstName}
                  onChangeText={(value) => setContact((prev) => ({ ...prev, firstName: value }))}
                  placeholder="First"
                />
              </View>
              <View className="flex-1">
                <Label>Last name</Label>
                <Input
                  value={contact.lastName}
                  onChangeText={(value) => setContact((prev) => ({ ...prev, lastName: value }))}
                  placeholder="Last"
                />
              </View>
            </View>
          </View>
          <View className="mb-6 rounded-2xl bg-card p-4">
            <Text className="mb-4 text-lg font-semibold text-foreground">Shipping Address</Text>
            {customer?.addresses?.edges?.length ? (
              <View className="mb-4 rounded-xl border border-border p-3">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-foreground">Saved addresses</Text>
                  <Button size="sm" variant="secondary" onPress={() => router.push("/addresses")}>
                    <Text>Manage</Text>
                  </Button>
                </View>
                <View className="flex-col gap-2">
                  {customer.addresses.edges.map((edge) => (
                    <Button
                      key={edge.node.id}
                      variant="outline"
                      onPress={() => handleSelectSavedAddress(edge.node)}
                      className="justify-start"
                    >
                      <View>
                        <Text className="text-sm font-semibold text-foreground">
                          {edge.node.firstName} {edge.node.lastName}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {edge.node.address1}
                          {edge.node.address2 ? `, ${edge.node.address2}` : ""}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {edge.node.city}, {edge.node.province} {edge.node.zip}
                        </Text>
                      </View>
                    </Button>
                  ))}
                </View>
              </View>
            ) : null}
            <View className="mb-3">
              <Label>Address</Label>
              <Input
                value={shipping.address1}
                onChangeText={(value) => setShipping((prev) => ({ ...prev, address1: value }))}
                placeholder="Street address"
              />
            </View>
            <View className="mb-3">
              <Label>Apartment, suite, etc. (optional)</Label>
              <Input
                value={shipping.address2}
                onChangeText={(value) => setShipping((prev) => ({ ...prev, address2: value }))}
                placeholder="Unit"
              />
            </View>
            <View className="mb-3">
              <Label>City</Label>
              <Input
                value={shipping.city}
                onChangeText={(value) => setShipping((prev) => ({ ...prev, city: value }))}
                placeholder="City"
              />
            </View>
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Label>State</Label>
                <Input
                  value={shipping.state}
                  onChangeText={(value) => setShipping((prev) => ({ ...prev, state: value }))}
                  placeholder="State"
                />
              </View>
              <View className="flex-1">
                <Label>ZIP</Label>
                <Input
                  value={shipping.postalCode}
                  onChangeText={(value) => setShipping((prev) => ({ ...prev, postalCode: value }))}
                  placeholder="ZIP"
                />
              </View>
            </View>
            <View>
              <Label>Country</Label>
              <Input
                value={shipping.country}
                onChangeText={(value) => setShipping((prev) => ({ ...prev, country: value }))}
                placeholder="Country"
              />
            </View>
          </View>
          <View className="mb-6 rounded-2xl bg-card p-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">Billing Address</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-muted-foreground">Same as shipping</Text>
                <Switch
                  checked={billingSameAsShipping}
                  onCheckedChange={setBillingSameAsShipping}
                />
              </View>
            </View>
            {!billingSameAsShipping && (
              <>
                <View className="mb-3">
                  <Label>Address</Label>
                  <Input
                    value={billing.address1}
                    onChangeText={(value) => setBilling((prev) => ({ ...prev, address1: value }))}
                    placeholder="Street address"
                  />
                </View>
                <View className="mb-3">
                  <Label>Apartment, suite, etc. (optional)</Label>
                  <Input
                    value={billing.address2}
                    onChangeText={(value) => setBilling((prev) => ({ ...prev, address2: value }))}
                    placeholder="Unit"
                  />
                </View>
                <View className="mb-3">
                  <Label>City</Label>
                  <Input
                    value={billing.city}
                    onChangeText={(value) => setBilling((prev) => ({ ...prev, city: value }))}
                    placeholder="City"
                  />
                </View>
                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1">
                    <Label>State</Label>
                    <Input
                      value={billing.state}
                      onChangeText={(value) => setBilling((prev) => ({ ...prev, state: value }))}
                      placeholder="State"
                    />
                  </View>
                  <View className="flex-1">
                    <Label>ZIP</Label>
                    <Input
                      value={billing.postalCode}
                      onChangeText={(value) =>
                        setBilling((prev) => ({ ...prev, postalCode: value }))
                      }
                      placeholder="ZIP"
                    />
                  </View>
                </View>
                <View>
                  <Label>Country</Label>
                  <Input
                    value={billing.country}
                    onChangeText={(value) => setBilling((prev) => ({ ...prev, country: value }))}
                    placeholder="Country"
                  />
                </View>
              </>
            )}
          </View>
          <View className="mb-6 rounded-2xl bg-card p-4">
            <Text className="mb-3 text-lg font-semibold text-foreground">Shipping Method</Text>
            <View className="flex-col gap-2">
              {shippingOptions.map((option) => {
                const selected = option.id === selectedShippingId;
                return (
                  <Button
                    key={option.id}
                    variant={selected ? "default" : "outline"}
                    onPress={() => setSelectedShippingId(option.id)}
                    className="justify-between"
                  >
                    <View className="flex-row items-center justify-between w-full">
                      <Text className={selected ? "text-primary-foreground" : "text-foreground"}>
                        {option.label}
                      </Text>
                      <Text className={selected ? "text-primary-foreground" : "text-foreground"}>
                        {formatPrice(option.amount.toFixed(2), cart.cost.totalAmount.currencyCode)}
                      </Text>
                    </View>
                  </Button>
                );
              })}
            </View>
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
            <View className="mb-3 flex-row justify-between">
              <Text className="text-base text-muted-foreground">Shipping</Text>
              <Text className="text-base text-foreground">
                {formatPrice(shippingAmount.toFixed(2), cart.cost.totalAmount.currencyCode)}
              </Text>
            </View>
            {appliedDiscount && discountAmount > 0 ? (
              <View className="mb-3 flex-row justify-between">
                <Text className="text-base text-muted-foreground">
                  Discount ({appliedDiscount.code})
                </Text>
                <Text className="text-base text-foreground">
                  -{formatPrice(discountAmount.toFixed(2), cart.cost.totalAmount.currencyCode)}
                </Text>
              </View>
            ) : null}
            <View className="border-t border-border pt-3">
              <View className="flex-row justify-between">
                <Text className="text-lg font-semibold text-foreground">Total</Text>
                <Text className="text-xl font-bold text-primary">
                  {formatPrice(totalAfterDiscount.toFixed(2), cart.cost.totalAmount.currencyCode)}
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
              <Button
                size="sm"
                variant="secondary"
                disabled={!promoCode.trim() || isApplyingPromo}
                onPress={applyPromoCode}
              >
                {isApplyingPromo ? <ActivityIndicator size="small" /> : <Text>Apply</Text>}
              </Button>
            </View>
            {availableDiscounts.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {availableDiscounts.slice(0, 6).map((code) => (
                  <Button
                    key={code.code}
                    size="sm"
                    variant="outline"
                    onPress={() => {
                      setPromoCode(code.code);
                      setAppliedDiscount(code);
                    }}
                  >
                    <Text>{code.code}</Text>
                  </Button>
                ))}
              </View>
            ) : null}
            <Text className="mt-2 text-xs text-muted-foreground">
              {Platform.OS === "web"
                ? "Promo codes apply in Shopify checkout."
                : "Promo codes apply to your in-app payment and Shopify order."}
            </Text>
          </View>
          {Platform.OS !== "web" && (
            <>
              <View className="mb-6 rounded-2xl bg-card p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-foreground">
                    Use saved payment methods
                  </Text>
                  <Switch
                    checked={useSavedPaymentMethods}
                    onCheckedChange={setUseSavedPaymentMethods}
                  />
                </View>
                <Text className="mt-2 text-xs text-muted-foreground">
                  Enable this to show saved cards in the payment sheet (requires login email).
                </Text>
              </View>
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
                      <Text className="ml-2 text-xs font-medium text-foreground">
                        {method.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
          <View className="h-32" />
        </ScrollView>
        <View className="border-t border-border bg-background px-4 py-4">
          <Button onPress={handleShopifyCheckout} className="w-full mb-2">
            <View className="flex-row items-center">
              <LucideIcon name="ExternalLink" size={20} color={primaryForeground} />
              <Text className="ml-2">Continue to Shopify Checkout</Text>
            </View>
          </Button>
          {Platform.OS !== "web" && (
            <>
              <Button
                onPress={handleCardPayment}
                className="w-full mb-2"
                disabled={isProcessingCard || isProcessingWallet || !backendHealthy}
              >
                <View className="flex-row items-center">
                  <LucideIcon name="CreditCard" size={20} color={primaryForeground} />
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
