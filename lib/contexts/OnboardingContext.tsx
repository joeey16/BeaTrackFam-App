import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingContextType {
  hasSeenOnboarding: boolean;
  hasCompletedWelcome: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
  completeWelcome: () => Promise<void>;
}

const OnboardingContext = React.createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_KEY = "@beatrackfam:onboarding_completed";
const WELCOME_KEY = "@beatrackfam:welcome_completed";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = React.useState(false);
  const [hasCompletedWelcome, setHasCompletedWelcome] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const [onboardingValue, welcomeValue] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem(WELCOME_KEY),
      ]);
      setHasSeenOnboarding(onboardingValue === "true");
      setHasCompletedWelcome(welcomeValue === "true");
    } catch (error) {
      console.error("Failed to load onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error("Failed to save onboarding status:", error);
    }
  };

  const completeWelcome = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_KEY, "true");
      setHasCompletedWelcome(true);
    } catch (error) {
      console.error("Failed to save welcome status:", error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        hasSeenOnboarding,
        hasCompletedWelcome,
        isLoading,
        completeOnboarding,
        completeWelcome,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = React.useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
