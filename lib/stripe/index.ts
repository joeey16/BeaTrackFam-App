import { Platform } from "react-native";

const impl =
  Platform.OS === "web"
    ? (require("./index.web") as typeof import("./index.web"))
    : (require("./index.native") as typeof import("./index.native"));

export const StripeProvider = impl.StripeProvider;
export const useStripe = impl.useStripe;
export const usePlatformPay = impl.usePlatformPay;
export const PlatformPayButton = impl.PlatformPayButton;
export const PlatformPay = impl.PlatformPay;
