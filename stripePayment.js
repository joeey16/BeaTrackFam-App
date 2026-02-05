import { initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";

/**
 * Initializes the Stripe Payment Sheet with the Apple Pay "Immediate" fix.
 */
export const initializeApplePay = async (
  paymentIntentClientSecret,
  merchantDisplayName = "BeaTrackFam",
) => {
  const { error } = await initPaymentSheet({
    merchantCountryCode: "US",
    merchantDisplayName: "BeaTrackFam", // Stripe UI name
    paymentIntentClientSecret: paymentIntentClientSecret,
    applePay: {
      merchantId: "merchant.com.beatrackfaminc", // Ensure this matches app.json
      merchantCountryCode: "US",
      paymentSummaryItems: [
        // You can add subtotal items here if you want
        {
          label: "Subtotal",
          amount: "10.00",
          paymentType: "Immediate",
        },
        // THE FIX: The LAST item must have your Merchant Name as the label
        {
          label: "BeaTrackFam Inc",
          amount: "10.00",
          paymentType: "Immediate",
        },
      ],
    },
  });
  // ... rest of your code

  if (error) {
    console.error("Error initializing payment sheet:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Opens the Payment Sheet after it has been initialized.
 */
export const openPaymentSheet = async () => {
  const { error } = await presentPaymentSheet();

  if (error) {
    console.error("Payment sheet error:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
};
