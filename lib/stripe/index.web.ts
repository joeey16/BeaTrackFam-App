import * as React from "react";

export const StripeProvider = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export const useStripe = () => ({
  initPaymentSheet: async () => ({ error: { message: "Stripe is not supported on web." } }),
  presentPaymentSheet: async () => ({ error: { message: "Stripe is not supported on web." } }),
});

export const usePlatformPay = () => ({
  isPlatformPaySupported: async () => false,
  confirmPlatformPayPayment: async () => ({
    error: { message: "Platform Pay is not supported on web." },
  }),
});

export const PlatformPayButton = () => null;

export const PlatformPay = {
  ButtonType: {
    Pay: "pay",
  },
  ButtonStyle: {
    Black: "black",
  },
  PaymentSummaryItemType: {
    Final: "final",
  },
};
