import * as React from "react";
import { View, ScrollView, ActivityIndicator, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { useCartContext } from "~/lib/contexts/CartContext";
import { useCart } from "~/lib/shopify/hooks";
import { router } from "expo-router";
import LucideIcon from "~/lib/icons/LucideIcon";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  useStripe,
  usePlatformPay,
  PlatformPayButton,
  PlatformPay,
} from "@stripe/stripe-react-native";
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
  const merchantIdentifier = "merchant.com.beatrackfaminc";
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

  const shippingOptions: ShippingOption[] = [
    { id: "standard", label: "Standard", amount: 5.99 },
    { id: "expedited", label: "Expedited", amount: 10.99 },
    { id: "premium", label: "Premium", amount: 20.99 },
  ];

  const { cartId, clearCart } = useCartContext();
  const { data: cart, isLoading } = useCart(cartId);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();
  const { accessToken } = useAuth();
  const { data: customer } = useCustomer(accessToken);

  // --- STATE ---
  const [paymentIntentSecret, setPaymentIntentSecret] = React.useState<string | null>(null);
  const [isProcessingCard, setIsProcessingCard] = React.useState(false);
  const [isProcessingWallet, setIsProcessingWallet] = React.useState(false);
  const [isPlatformPayReady, setIsPlatformPayReady] = React.useState(false);
  const [selectedShippingId, setSelectedShippingId] = React.useState("standard");
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

  // Calculations
  const selectedShipping = shippingOptions.find((o) => o.id === selectedShippingId);
  const shippingAmount = selectedShipping?.amount ?? 0;
  const subtotalAmount = Number.parseFloat(cart?.cost.subtotalAmount.amount || "0");
  const taxAmount = Number.parseFloat(cart?.cost.totalTaxAmount?.amount || "0");
  const totalAmount = subtotalAmount + shippingAmount + taxAmount;

  // --- 1. INSTANT LOADING LOGIC (PRE-FETCH) ---
  // This fetches the "ticket" from Stripe while the user is typing their address
  React.useEffect(() => {
    if (!cart || !backendUrl) return;

    const prefetchSecret = async () => {
      try {
        const response = await fetch(`${backendUrl}/payments/create-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(totalAmount * 100),
            currency: cart.cost.totalAmount.currencyCode.toLowerCase(),
          }),
        });
        const data = await response.json();
        setPaymentIntentSecret(data.clientSecret);
      } catch (e) {
        console.error("Prefetch error:", e);
      }
    };

    prefetchSecret();
  }, [cart, selectedShippingId, totalAmount]);

  // --- 2. APPLE/GOOGLE PAY SUPPORT CHECK ---
  React.useEffect(() => {
    (async () => {
      const supported = await isPlatformPaySupported({
        applePay: true,
        googlePay: { testEnv: true },
      });
      setIsPlatformPayReady(supported);
    })();
  }, [isPlatformPaySupported]);

  // Sync Customer Data
  React.useEffect(() => {
    if (customer) {
      setContact((prev) => ({
        ...prev,
        email: customer.email || prev.email,
        firstName: customer.firstName || prev.firstName,
        lastName: customer.lastName || prev.lastName,
      }));
    }
  }, [customer]);

  const validateForm = () => {
    if (!contact.email || !shipping.address1 || !contact.firstName) {
      Alert.alert("Required Fields", "Please complete the contact and shipping sections.");
      return false;
    }
    return true;
  };

  const createShopifyOrder = async (paymentIntentId: string) => {
    const response = await fetch(`${backendUrl}/shopify/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineItems: cart?.lines.edges.map((e) => ({
          variantId: e.node.merchandise.id,
          quantity: e.node.quantity,
        })),
        customerEmail: contact.email,
        shippingAddress: shipping,
        transactionId: paymentIntentId,
        totalAmount: totalAmount.toFixed(2),
      }),
    });
    return await response.json();
  };

  // --- CARD HANDLER ---
  const handleCardPayment = async () => {
    if (!validateForm()) return;
    if (!paymentIntentSecret) {
      Alert.alert("Loading", "Still preparing checkout. Please try again in a second.");
      return;
    }

    try {
      setIsProcessingCard(true);
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentIntentSecret,
        merchantDisplayName: "BeaTrackFam",
        applePay: { merchantCountryCode: "US" },
      });
      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) throw new Error(presentError.message);

      const order = await createShopifyOrder(paymentIntentSecret.split("_secret_")[0]);
      await clearCart();
      router.replace({ pathname: "/thankyou", params: { orderNumber: order.orderNumber } });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsProcessingCard(false);
    }
  };

  // --- APPLE PAY HANDLER ---
  const handlePlatformPay = async () => {
    if (!validateForm()) return;
    if (!paymentIntentSecret) {
      Alert.alert("Wait", "Securely connecting to Stripe...");
      return;
    }

    try {
      setIsProcessingWallet(true);
      const { error } = await confirmPlatformPayPayment(paymentIntentSecret, {
        applePay: {
          cartItems: [
            {
              label: "BeaTrackFam Order",
              amount: totalAmount.toFixed(2),
              type: PlatformPay.PaymentSummaryItemType.Immediate,
            },
          ],
          merchantCountryCode: "US",
          currencyCode: cart?.cost.totalAmount.currencyCode || "USD",
          merchantIdentifier: merchantIdentifier, // Fixes "returned null"
        },
      });

      if (error) throw new Error(error.message);

      const order = await createShopifyOrder(paymentIntentSecret.split("_secret_")[0]);
      await clearCart();
      router.replace({ pathname: "/thankyou", params: { orderNumber: order.orderNumber } });
    } catch (e: any) {
      if (e.message !== "The payment has been canceled") Alert.alert("Payment Error", e.message);
    } finally {
      setIsProcessingWallet(false);
    }
  };

  if (isLoading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-3xl font-extrabold mb-6">Checkout</Text>

        {/* CONTACT INFO */}
        <View className="mb-6 rounded-2xl bg-card p-4 border border-border shadow-sm">
          <Text className="mb-4 text-lg font-bold">Contact Details</Text>
          <Input
            placeholder="Email"
            value={contact.email}
            onChangeText={(v) => setContact((p) => ({ ...p, email: v }))}
            className="mb-3"
          />
          <View className="flex-row gap-3">
            <Input
              placeholder="First Name"
              value={contact.firstName}
              onChangeText={(v) => setContact((p) => ({ ...p, firstName: v }))}
              className="flex-1"
            />
            <Input
              placeholder="Last Name"
              value={contact.lastName}
              onChangeText={(v) => setContact((p) => ({ ...p, lastName: v }))}
              className="flex-1"
            />
          </View>
        </View>

        {/* SHIPPING ADDRESS */}
        <View className="mb-6 rounded-2xl bg-card p-4 border border-border shadow-sm">
          <Text className="mb-4 text-lg font-bold">Shipping Address</Text>
          <Input
            placeholder="Address"
            value={shipping.address1}
            onChangeText={(v) => setShipping((p) => ({ ...p, address1: v }))}
            className="mb-3"
          />
          <Input
            placeholder="City"
            value={shipping.city}
            onChangeText={(v) => setShipping((p) => ({ ...p, city: v }))}
            className="mb-3"
          />
          <View className="flex-row gap-3">
            <Input
              placeholder="State"
              value={shipping.state}
              onChangeText={(v) => setShipping((p) => ({ ...p, state: v }))}
              className="flex-1"
            />
            <Input
              placeholder="ZIP Code"
              value={shipping.postalCode}
              onChangeText={(v) => setShipping((p) => ({ ...p, postalCode: v }))}
              className="flex-1"
            />
          </View>
        </View>

        {/* SUMMARY */}
        <View className="mb-6 rounded-2xl bg-muted/30 p-4 border border-border">
          <Text className="mb-3 text-lg font-bold">Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-muted-foreground">Subtotal</Text>
            <Text className="font-medium">{formatPrice(subtotalAmount.toFixed(2), "USD")}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-muted-foreground">Shipping</Text>
            <Text className="font-medium">{formatPrice(shippingAmount.toFixed(2), "USD")}</Text>
          </View>
          <View className="flex-row justify-between border-t border-border pt-3 mt-1">
            <Text className="text-xl font-bold">Total</Text>
            <Text className="text-xl font-bold text-primary">
              {formatPrice(totalAmount.toFixed(2), "USD")}
            </Text>
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* STICKY FOOTER */}
      <View className="border-t border-border bg-background px-4 py-6 shadow-lg">
        <Button
          onPress={handleCardPayment}
          className="mb-3 h-14 rounded-xl shadow-md"
          disabled={isProcessingCard || isProcessingWallet}
        >
          <Text className="text-white text-lg font-bold">
            {isProcessingCard ? "Processing..." : "Pay with Credit Card"}
          </Text>
        </Button>

        {isPlatformPayReady && (
          <PlatformPayButton
            type={PlatformPay.ButtonType.Pay}
            appearance={PlatformPay.ButtonStyle.Black}
            borderRadius={12}
            onPress={handlePlatformPay}
            disabled={isProcessingCard || isProcessingWallet}
            style={{ height: 56, width: "100%" }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
