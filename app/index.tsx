import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useCartContext } from "~/lib/contexts/CartContext";
import { useOnboarding } from "~/lib/contexts/OnboardingContext";
import * as React from "react";

export default function Index() {
  const { accessToken, isLoading: isLoadingAuth } = useAuth();
  const { cartId, isLoading: isLoadingCart, initializeCart } = useCartContext();
  const {
    hasSeenOnboarding,
    hasCompletedWelcome,
    isLoading: isLoadingOnboarding,
  } = useOnboarding();

  // Initialize cart if it doesn't exist
  React.useEffect(() => {
    if (!isLoadingCart && !cartId) {
      initializeCart();
    }
  }, [isLoadingCart, cartId]);

  if (isLoadingAuth || isLoadingCart || isLoadingOnboarding) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Redirect to onboarding if user hasn't seen it
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // Redirect to welcome screen if user hasn't completed it and isn't authenticated
  if (!hasCompletedWelcome && !accessToken) {
    return <Redirect href="/auth/welcome" />;
  }

  // Always redirect to tabs - user can access account from there
  return <Redirect href="/(tabs)" />;
}
