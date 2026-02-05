import * as React from "react";
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { router, useLocalSearchParams } from "expo-router";

// UI Components
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import LucideIcon from "~/lib/icons/LucideIcon";
import AuthErrorDialog from "~/components/auth/AuthErrorDialog";

// Hooks & Contexts
import {
  useGoogleAuth,
  useFacebookAuth,
  loginWithApple,
  GOOGLE_CLIENT_IDS,
  FACEBOOK_APP_ID,
} from "~/lib/auth/authService";
import { useCustomerCreate } from "~/lib/shopify/hooks";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useOnboarding } from "~/lib/contexts/OnboardingContext";
import { useTheme } from "~/theming/ThemeProvider";
import {
  generateSocialPassword,
  setSocialPassword,
  type SocialProvider,
} from "~/lib/auth/socialCredentials";

export default function SignupScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const { completeWelcome } = useOnboarding();
  const params = useLocalSearchParams();

  // Shopify Hooks
  const customerCreate = useCustomerCreate();

  // Auth Providers
  const { promptAsync: googleSignup, userInfo: googleUser } = useGoogleAuth();
  const { promptAsync: facebookSignup, userInfo: facebookUser } = useFacebookAuth();

  // Form State
  const [email, setEmail] = React.useState((params?.email as string) || "");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // Loading & Error States
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = React.useState("");
  const [errorDialog, setErrorDialog] = React.useState<{
    title: string;
    message: string;
    actions: Array<{ label: string; onPress: () => void }>;
  } | null>(null);

  // Helpers
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const evaluatePasswordStrength = (value: string) => {
    if (value.length === 0) return "";
    if (value.length < 6) return "Weak";
    if (value.match(/[A-Z]/) && value.match(/[0-9]/) && value.length >= 8) return "Strong";
    return "Medium";
  };

  const isFormValid = isValidEmail(email) && password.length >= 6 && passwordStrength !== "Weak";
  const isGoogleConfigured =
    (Platform.OS === "ios" && !!GOOGLE_CLIENT_IDS.ios) ||
    (Platform.OS === "android" && !!GOOGLE_CLIENT_IDS.android) ||
    (Platform.OS === "web" && !!GOOGLE_CLIENT_IDS.web);
  const isFacebookConfigured = !!FACEBOOK_APP_ID;

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Something went wrong. Please try again.";

  const showAuthError = (
    title: string,
    message: string,
    actions: Array<{ label: string; onPress: () => void }>,
  ) => {
    setErrorDialog({ title, message, actions });
  };

  /**
   * Core Logic: Handle Account Creation + Auto Login
   */
  const performShopifySignup = async (
    provider: SocialProvider,
    providerUser: { email: string; name?: string },
  ) => {
    try {
      const signupEmail = providerUser.email;
      const signupPassword = generateSocialPassword(signupEmail);

      const token = await customerCreate.mutateAsync({
        email: signupEmail,
        password: signupPassword,
        firstName: providerUser.name || "",
      });

      await setSocialPassword(signupEmail, signupPassword, provider);
      await login(token.accessToken);
      await completeWelcome();
      router.replace("/(tabs)/account");
    } catch (error) {
      const message = getErrorMessage(error);
      showAuthError("Signup failed", message, [
        {
          label: "Log in",
          onPress: () =>
            router.push({ pathname: "/auth/login", params: { email: providerUser.email } }),
        },
        { label: "Forgot password", onPress: () => router.push("/auth/forgot-password") },
        { label: "Try again", onPress: () => {} },
      ]);
    } finally {
      setLoadingProvider(null);
    }
  };

  // --- Handlers ---

  const handleManualSignup = async () => {
    if (!isFormValid) return;
    setLoadingProvider("email");

    try {
      const token = await customerCreate.mutateAsync({ email, password, firstName: "" });
      await login(token.accessToken);
      await completeWelcome();
      router.replace("/(tabs)/account");
    } catch (error) {
      const message = getErrorMessage(error);
      showAuthError("Signup failed", message, [
        {
          label: "Log in",
          onPress: () => router.push({ pathname: "/auth/login", params: { email } }),
        },
        { label: "Forgot password", onPress: () => router.push("/auth/forgot-password") },
        { label: "Try again", onPress: () => {} },
      ]);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleAppleSignup = async () => {
    setLoadingProvider("apple");
    try {
      const appleUser = await loginWithApple();
      if (appleUser?.email) {
        await performShopifySignup("apple", { email: appleUser.email, name: appleUser.name });
      } else {
        showAuthError(
          "Apple sign-up incomplete",
          "Apple didn’t share your email. Please use email sign-up or another provider.",
          [
            { label: "Use email sign-up", onPress: () => {} },
            { label: "Try again", onPress: () => {} },
          ],
        );
        setLoadingProvider(null);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      showAuthError("Apple sign-up failed", message, [
        { label: "Try again", onPress: () => {} },
        { label: "Use email sign-up", onPress: () => {} },
      ]);
      setLoadingProvider(null);
    }
  };

  // Listen for Social Data
  React.useEffect(() => {
    if (googleUser?.email) {
      performShopifySignup("google", googleUser);
    }
  }, [googleUser]);

  React.useEffect(() => {
    if (facebookUser?.email) {
      performShopifySignup("facebook", facebookUser);
    }
  }, [facebookUser]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="py-8">
            <View className="mb-8">
              <Text className="text-h1 mb-2 font-bold text-foreground">Create Account</Text>
              <Text className="text-base text-muted-foreground">
                Sign up for your BeaTrackFam account
              </Text>
            </View>

            {/* Social Buttons */}
            <View className="gap-y-3 mb-8">
              <Button
                variant="outline"
                disabled={!!loadingProvider}
                onPress={() => {
                  if (!isGoogleConfigured) {
                    showAuthError(
                      "Google sign-up not configured",
                      "Add your Google client IDs to enable this provider.",
                      [{ label: "OK", onPress: () => {} }],
                    );
                    return;
                  }
                  setLoadingProvider("google");
                  googleSignup().catch(() => setLoadingProvider(null));
                }}
              >
                {loadingProvider === "google" ? (
                  <ActivityIndicator size="sm" />
                ) : (
                  <Text>Sign up with Google</Text>
                )}
              </Button>

              <Button
                variant="outline"
                disabled={!!loadingProvider}
                onPress={() => {
                  if (!isFacebookConfigured) {
                    showAuthError(
                      "Facebook sign-up not configured",
                      "Add your Facebook App ID to enable this provider.",
                      [{ label: "OK", onPress: () => {} }],
                    );
                    return;
                  }
                  setLoadingProvider("facebook");
                  facebookSignup().catch(() => setLoadingProvider(null));
                }}
              >
                {loadingProvider === "facebook" ? (
                  <ActivityIndicator size="sm" />
                ) : (
                  <Text>Sign up with Facebook</Text>
                )}
              </Button>

              {Platform.OS === "ios" && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                  buttonStyle={
                    theme.dark
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                      : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                  }
                  cornerRadius={12}
                  style={{
                    width: "100%",
                    height: 48,
                    opacity: loadingProvider === "apple" ? 0.5 : 1,
                  }}
                  onPress={handleAppleSignup}
                />
              )}
            </View>

            <View className="flex-row items-center mb-8">
              <View className="flex-1 h-[1px] bg-border" />
              <Text className="mx-4 text-muted-foreground text-xs uppercase">Or use email</Text>
              <View className="flex-1 h-[1px] bg-border" />
            </View>

            {/* Form */}
            <View className="space-y-4">
              <View>
                <Text className="mb-2 text-sm font-medium">Email</Text>
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
                <Text className="mb-2 text-sm font-medium">Password</Text>
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
                  <Button variant="ghost" size="sm" onPress={() => setShowPassword(!showPassword)}>
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

            <Button
              className="mt-6 h-12"
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
      <AuthErrorDialog
        open={!!errorDialog}
        onOpenChange={(open) => {
          if (!open) setErrorDialog(null);
        }}
        title={errorDialog?.title ?? ""}
        message={errorDialog?.message ?? ""}
        actions={errorDialog?.actions ?? []}
      />
    </SafeAreaView>
  );
}
