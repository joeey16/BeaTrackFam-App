import { initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";

/**
 * Initializes the Stripe Payment Sheet with the Apple Pay "Immediate" fix.
 */
export const initializeApplePay = async (
  paymentIntentClientSecret,
  merchantDisplayName = "BeaTrackFam Inc",
) => {
  const { error } = await initPaymentSheet({
    merchantCountryCode: "US",
    merchantDisplayName: merchantDisplayName,
    paymentIntentClientSecret: paymentIntentClientSecret,
    applePay: {
      merchantCountryCode: "US",
      paymentSummaryItems: [
        {
          label: merchantDisplayName,
          amount: "10.00",
          paymentType: "Immediate", // Your Fix
        },
      ],
    },
  });

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
