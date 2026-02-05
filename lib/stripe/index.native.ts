import * as React from "react";
import { NativeModules } from "react-native";
import Constants from "expo-constants";

const isExpoGo = Constants.appOwnership === "expo";
const hasStripeModule =
  !isExpoGo && (NativeModules.StripeSdk || NativeModules.StripeSdkModule || NativeModules.Stripe);

type StripeModule = typeof import("@stripe/stripe-react-native");

let stripe: StripeModule | null = null;

if (hasStripeModule) {
  stripe = require("@stripe/stripe-react-native") as StripeModule;
}

export const StripeProvider =
  stripe?.StripeProvider ??
  (({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children));

export const useStripe =
  stripe?.useStripe ??
  (() => ({
    initPaymentSheet: async () => ({}),
    presentPaymentSheet: async () => ({
      error: { message: "Stripe is not available in this build." },
    }),
  }));

export const usePlatformPay =
  stripe?.usePlatformPay ??
  (() => ({
    isPlatformPaySupported: async () => false,
    confirmPlatformPayPayment: async () => ({
      error: { message: "Platform Pay is not available in this build." },
    }),
  }));

export const PlatformPayButton = stripe?.PlatformPayButton ?? (() => null);

export const PlatformPay = stripe?.PlatformPay ?? ({} as const);

export type {
  PlatformPay as PlatformPayTypes,
  InitPaymentSheetParams,
  PresentPaymentSheetParams,
} from "@stripe/stripe-react-native";
