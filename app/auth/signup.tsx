import * as React from "react";
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

// UI Components
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import LucideIcon from "~/lib/icons/LucideIcon";
import AuthErrorDialog from "~/components/auth/AuthErrorDialog";

// Hooks & Contexts
import { useCustomerCreate, useCustomerUpdate } from "~/lib/shopify/hooks";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useOnboarding } from "~/lib/contexts/OnboardingContext";
import lightTheme from "~/theming/themes/light";

export default function SignupScreen() {
  const theme = lightTheme;
  const { login } = useAuth();
  const { completeWelcome } = useOnboarding();
  const params = useLocalSearchParams();

  // Shopify Hooks
  const customerCreate = useCustomerCreate();
  const customerUpdate = useCustomerUpdate();

  // Form State
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phoneDigits, setPhoneDigits] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("+1");
  const [showCountryPicker, setShowCountryPicker] = React.useState(false);
  const [email, setEmail] = React.useState((params?.email as string) || "");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // Loading & Error States
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorDialog, setErrorDialog] = React.useState<{
    title: string;
    message: string;
    actions: Array<{ label: string; onPress: () => void }>;
  } | null>(null);

  // Helpers
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const countryOptions = React.useMemo(
    () => [
      { code: "+1", country: "US", flag: "🇺🇸" },
      { code: "+1", country: "CA", flag: "🇨🇦" },
      { code: "+44", country: "GB", flag: "🇬🇧" },
      { code: "+61", country: "AU", flag: "🇦🇺" },
      { code: "+91", country: "IN", flag: "🇮🇳" },
      { code: "+86", country: "CN", flag: "🇨🇳" },
      { code: "+81", country: "JP", flag: "🇯🇵" },
      { code: "+49", country: "DE", flag: "🇩🇪" },
      { code: "+33", country: "FR", flag: "🇫🇷" },
      { code: "+39", country: "IT", flag: "🇮🇹" },
      { code: "+34", country: "ES", flag: "🇪🇸" },
      { code: "+52", country: "MX", flag: "🇲🇽" },
      { code: "+55", country: "BR", flag: "🇧🇷" },
    ],
    [],
  );
  const selectedCountry = countryOptions.find((option) => option.code === countryCode);
  const normalizedPhoneDigits = phoneDigits.replace(/\D/g, "");
  const phoneMaxDigits = countryCode === "+1" ? 10 : 15;
  const phoneValue = normalizedPhoneDigits
    ? `${countryCode}${normalizedPhoneDigits.slice(0, phoneMaxDigits)}`
    : "";

  const evaluatePasswordStrength = (value: string) => {
    if (value.length === 0) return "";
    if (value.length < 6) return "Weak";
    if (value.match(/[A-Z]/) && value.match(/[0-9]/) && value.length >= 8) return "Strong";
    return "Medium";
  };

  const isFormValid =
    isValidEmail(email) &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    password.length >= 6 &&
    passwordStrength !== "Weak";
  const requiredStar = (
    <Text className="text-destructive" aria-hidden>
      *
    </Text>
  );
  const getErrorMessage = (error: unknown) => {
    if (!(error instanceof Error)) {
      return "Something went wrong. Please try again.";
    }
    if (error.message.includes("All Shopify API versions failed")) {
      return "Shopify Storefront API error. Please confirm the Storefront API access token is correct and the Storefront API is enabled for your store.";
    }
    return error.message;
  };

  const showAuthError = (message: string, emailForLogin?: string) => {
    setSuccessMessage("");
    setErrorMessage(message);
    setErrorDialog({
      title: "Signup failed",
      message,
      actions: [
        {
          label: "Log in instead",
          onPress: () =>
            router.push({
              pathname: "/auth/login",
              params: emailForLogin ? { email: emailForLogin } : undefined,
            }),
        },
        { label: "Try again", onPress: () => setErrorDialog(null) },
      ],
    });
  };
  const showAuthSuccess = (message: string) => {
    setErrorMessage("");
    setSuccessMessage(message);
    setErrorDialog(null);
  };
  const waitForToast = () => new Promise((resolve) => setTimeout(resolve, 3500));

  const dismissToAccount = () => {
    if (typeof router.canDismiss === "function" && router.canDismiss()) {
      router.dismiss();
    }
    router.replace("/(tabs)/account");
  };

  // --- Handlers ---

  const handleManualSignup = async () => {
    if (!isFormValid) return;
    setLoadingProvider("email");

    try {
      const token = await customerCreate.mutateAsync({
        email,
        password,
        firstName,
        lastName,
        phone: phoneValue || undefined,
      });
      showAuthSuccess("Account created successfully. Redirecting to your account...");
      await login(token.accessToken);
      await customerUpdate.mutateAsync({
        accessToken: token.accessToken,
        customer: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phoneValue || undefined,
        },
      });
      await completeWelcome();
      await waitForToast();
      dismissToAccount();
    } catch (error) {
      const message = getErrorMessage(error);
      showAuthError(message, email);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <>
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
            <View className="py-8">
              <View className="mb-8 items-center">
                <View
                  className="h-20 w-20 items-center justify-center rounded-full mb-4"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <LucideIcon name="UserPlus" size={40} color={theme.colors.primaryForeground} />
                </View>
                <Text className="text-3xl mb-2 font-bold text-foreground text-center">
                  Join the Fam
                </Text>
                <Text className="text-base text-muted-foreground text-center">
                  Create your BeaTrackFam account
                </Text>
              </View>

              {/* Social Buttons Section (removed) */}

              {/* Form */}
              <View className="space-y-4">
                <View>
                  <View className="mb-2 flex-row items-center gap-1">
                    <Text className="text-sm font-medium text-foreground">First Name</Text>
                    {requiredStar}
                  </View>
                  <TextInput
                    placeholder="Enter your first name"
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
                  />
                </View>

                <View>
                  <View className="mb-2 flex-row items-center gap-1">
                    <Text className="text-sm font-medium text-foreground">Last Name</Text>
                    {requiredStar}
                  </View>
                  <TextInput
                    placeholder="Enter your last name"
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
                  />
                </View>

                <View>
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-foreground">
                      Phone (Optional - Leave empty to skip)
                    </Text>
                  </View>
                  <View className="flex-row">
                    <Pressable
                      onPress={() => setShowCountryPicker(!showCountryPicker)}
                      className="mr-2 rounded-xl border border-border bg-card px-3 py-3"
                      style={{ minWidth: 90 }}
                    >
                      <View className="flex-row items-center">
                        <Text className="text-base mr-1">{selectedCountry?.flag || "🌎"}</Text>
                        <Text className="text-base text-foreground mr-1">{countryCode}</Text>
                        <LucideIcon
                          name={showCountryPicker ? "ChevronUp" : "ChevronDown"}
                          size={16}
                          color={theme.colors.mutedForeground}
                        />
                      </View>
                    </Pressable>
                    <TextInput
                      placeholder={
                        countryCode === "+1" ? "Enter 10-digit number" : "Enter phone number"
                      }
                      placeholderTextColor={theme.colors.mutedForeground}
                      value={normalizedPhoneDigits.slice(0, phoneMaxDigits)}
                      onChangeText={(value) =>
                        setPhoneDigits(value.replace(/\D/g, "").slice(0, phoneMaxDigits))
                      }
                      keyboardType="phone-pad"
                      className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-foreground"
                    />
                  </View>
                  {showCountryPicker && (
                    <View className="mt-2 rounded-xl border border-border bg-card max-h-60">
                      <ScrollView>
                        {countryOptions.map((country, index) => (
                          <Pressable
                            key={`${country.code}-${country.country}-${index}`}
                            onPress={() => {
                              setCountryCode(country.code);
                              setShowCountryPicker(false);
                            }}
                            className={`flex-row items-center px-4 py-3 ${
                              countryCode === country.code ? "bg-primary/10" : ""
                            }`}
                          >
                            <Text className="text-lg mr-3">{country.flag}</Text>
                            <Text className="text-sm text-foreground flex-1">
                              {country.country}
                            </Text>
                            <Text className="text-sm text-muted-foreground">{country.code}</Text>
                            {countryCode === country.code && (
                              <LucideIcon
                                name="Check"
                                size={16}
                                color={theme.colors.primary}
                                style={{ marginLeft: 8 }}
                              />
                            )}
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View>
                  <View className="mb-2 flex-row items-center gap-1">
                    <Text className="text-sm font-medium text-foreground">Email</Text>
                    {requiredStar}
                  </View>
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
                  />
                </View>

                <View>
                  <View className="mb-2 flex-row items-center gap-1">
                    <Text className="text-sm font-medium text-foreground">Password</Text>
                    {requiredStar}
                  </View>
                  <View className="flex-row items-center rounded-xl border border-border bg-card px-4 py-3">
                    <TextInput
                      placeholder="Create a password"
                      placeholderTextColor={theme.colors.mutedForeground}
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        setPasswordStrength(evaluatePasswordStrength(value));
                      }}
                      secureTextEntry={!showPassword}
                      className="flex-1 text-foreground"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <LucideIcon
                        name={showPassword ? "EyeOff" : "Eye"}
                        size={20}
                        color={theme.colors.mutedForeground}
                      />
                    </Button>
                  </View>
                  {password.length > 0 && (
                    <Text
                      className="text-xs mt-1 ml-1"
                      style={{
                        color:
                          passwordStrength === "Weak"
                            ? "red"
                            : passwordStrength === "Medium"
                              ? "orange"
                              : "green",
                      }}
                    >
                      Strength: {passwordStrength}
                    </Text>
                  )}
                </View>
              </View>

              {errorMessage ? (
                <View className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                  <Text className="text-destructive text-center text-sm font-medium">
                    {errorMessage}
                  </Text>
                </View>
              ) : null}
              {successMessage ? (
                <View className="mt-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
                  <Text className="text-success text-center text-sm font-medium">
                    {successMessage}
                  </Text>
                </View>
              ) : null}

              <Button
                size="lg"
                className="mt-6 w-full"
                onPress={handleManualSignup}
                disabled={!isFormValid || !!loadingProvider}
              >
                {loadingProvider === "email" ? (
                  <ActivityIndicator color={theme.colors.primaryForeground} />
                ) : (
                  <Text className="font-bold">Create Account</Text>
                )}
              </Button>

              <View className="flex-row items-center justify-center mt-6">
                <Text className="text-muted-foreground">Already have an account? </Text>
                <Button variant="link" className="p-0" onPress={() => router.push("/auth/login")}>
                  <Text className="font-bold">Log In</Text>
                </Button>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <AuthErrorDialog
        open={!!errorDialog}
        onOpenChange={(open) => {
          if (!open) setErrorDialog(null);
        }}
        title={errorDialog?.title ?? ""}
        message={errorDialog?.message ?? ""}
        actions={errorDialog?.actions ?? []}
      />
    </>
  );
}
