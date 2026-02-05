import * as React from "react";
import { NativeModules } from "react-native";
import Constants from "expo-constants";

type Props = {
  children: React.ReactNode;
  publishableKey?: string;
  merchantIdentifier?: string;
  [key: string]: unknown;
};

const isExpoGo = Constants.appOwnership === "expo";
const hasStripeModule =
  !isExpoGo && (NativeModules.StripeSdk || NativeModules.StripeSdkModule || NativeModules.Stripe);

export function StripeProviderWrapper({ children, ...props }: Props) {
  if (!hasStripeModule) {
    return <>{children}</>;
  }

  const StripeProvider = require("@stripe/stripe-react-native")
    .StripeProvider as React.ComponentType<Props>;

  return <StripeProvider {...props}>{children}</StripeProvider>;
}
