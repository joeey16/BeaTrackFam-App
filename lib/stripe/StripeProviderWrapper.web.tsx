import * as React from "react";

type Props = {
  children: React.ReactNode;
};

export function StripeProviderWrapper({ children }: Props) {
  return <>{children}</>;
}
