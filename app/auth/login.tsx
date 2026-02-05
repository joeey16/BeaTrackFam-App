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
import { router } from "expo-router";

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
import { useCustomerCreate, useCustomerLogin } from "~/lib/shopify/hooks";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useOnboarding } from "~/lib/contexts/OnboardingContext";
import { useTheme } from "~/theming/ThemeProvider";
import {
  generateSocialPassword,
  getSocialPassword,
  setSocialPassword,
  type SocialProvider,
} from "~/lib/auth/socialCredentials";

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const { completeWelcome } = useOnboarding();
  const customerLogin = useCustomerLogin();
  const customerCreate = useCustomerCreate();

  // Auth Providers
  const { promptAsync: googleLogin, userInfo: googleUser } = useGoogleAuth();
  const { promptAsync: facebookLogin, userInfo: facebookUser } = useFacebookAuth();

  // Form State
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // Loading & Error States
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(null);
  const [errorDialog, setErrorDialog] = React.useState<{
    title: string;
    message: string;
    actions: Array<{ label: string; onPress: () => void }>;
  } | null>(null);

  // Validation
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isLoginFormValid = isValidEmail(email) && password.length > 0;
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
   * Core Logic: Handle Shopify Authentication
   * Used by both Email and Social login paths
   */
  const performShopifyLogin = async (userEmail: string, userPassword: string) => {
    try {
      const result = await customerLogin.mutateAsync({
        email: userEmail,
        password: userPassword,
      });

      await login(result.accessToken);
      await completeWelcome();
      router.replace("/(tabs)/account");
    } catch (error) {
      throw error;
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleSocialAuth = async (
    provider: SocialProvider,
    profile: { email: string; name?: string },
  ) => {
    setLoadingProvider(provider);
    const storedPassword = await getSocialPassword(profile.email);

    if (storedPassword) {
      try {
        await performShopifyLogin(profile.email, storedPassword);
        return;
      } catch (error) {
        const message = getErrorMessage(error);
        showAuthError("Login failed", message, [
          { label: "Try again", onPress: () => {} },
          { label: "Forgot password", onPress: () => router.push("/auth/forgot-password") },
          { label: "Use email login", onPress: () => {} },
        ]);
        return;
      }
    }

    const newPassword = generateSocialPassword(profile.email);
    try {
      const token = await customerCreate.mutateAsync({
        email: profile.email,
        password: newPassword,
        firstName: profile.name || "",
      });
      await setSocialPassword(profile.email, newPassword, provider);
      await login(token.accessToken);
      await completeWelcome();
      router.replace("/(tabs)/account");
    } catch (error) {
      const message = getErrorMessage(error);
      showAuthError("Account not linked", message, [
        { label: "Use email login", onPress: () => {} },
        { label: "Forgot password", onPress: () => router.push("/auth/forgot-password") },
        { label: "Try again", onPress: () => {} },
      ]);
    } finally {
      setLoadingProvider(null);
    }
  };

  // --- Handlers ---

  const handleEmailLogin = async () => {
    if (!isLoginFormValid) return;
    setLoadingProvider("email");
    try {
      await performShopifyLogin(email, password);
    } catch (error) {
      const message = getErrorMessage(error);
      showAuthError("Login failed", message, [
        { label: "Try again", onPress: () => {} },
        { label: "Forgot password", onPress: () => router.push("/auth/forgot-password") },
        {
          label: "Sign up",
          onPress: () => router.push({ pathname: "/auth/signup", params: { email } }),
        },
      ]);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleAppleLogin = async () => {
    setLoadingProvider("apple");
    try {
      const appleUser = await loginWithApple();
      if (appleUser?.email) {
        await handleSocialAuth("apple", { email: appleUser.email, name: appleUser.name });
      } else {
        showAuthError(
          "Apple sign-in incomplete",
          "Apple didn’t share your email. Please use email login or another provider.",
          [
            { label: "Use email login", onPress: () => {} },
            { label: "Try again", onPress: () => {} },
          ],
        );
        setLoadingProvider(null);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      showAuthError("Apple sign-in failed", message, [
        { label: "Try again", onPress: () => {} },
        { label: "Use email login", onPress: () => {} },
      ]);
      setLoadingProvider(null);
    }
  };

  // Listen for Social Data returning from AuthSession
  React.useEffect(() => {
    if (googleUser?.email) {
      handleSocialAuth("google", { email: googleUser.email, name: googleUser.name });
    }
  }, [googleUser]);

  React.useEffect(() => {
    if (facebookUser?.email) {
      handleSocialAuth("facebook", { email: facebookUser.email, name: facebookUser.name });
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
              <Text className="text-h1 mb-2 font-bold text-foreground">Welcome Back</Text>
              <Text className="text-base text-muted-foreground">
                Log in to your BeaTrackFam account
              </Text>
            </View>

            {/* Social Buttons Section */}
            <View className="gap-y-3 mb-8">
              {/* Google */}
              <Button
                variant="outline"
                disabled={!!loadingProvider}
                onPress={() => {
                  if (!isGoogleConfigured) {
                    showAuthError(
                      "Google sign-in not configured",
                      "Add your Google client IDs to enable this provider.",
                      [{ label: "OK", onPress: () => {} }],
                    );
                    return;
                  }
                  setLoadingProvider("google");
                  googleLogin().catch(() => setLoadingProvider(null));
                }}
              >
                {loadingProvider === "google" ? (
                  <ActivityIndicator size="sm" />
                ) : (
                  <Text>Sign in with Google</Text>
                )}
              </Button>

              {/* Facebook */}
              <Button
                variant="outline"
                disabled={!!loadingProvider}
                onPress={() => {
                  if (!isFacebookConfigured) {
                    showAuthError(
                      "Facebook sign-in not configured",
                      "Add your Facebook App ID to enable this provider.",
                      [{ label: "OK", onPress: () => {} }],
                    );
                    return;
                  }
                  setLoadingProvider("facebook");
                  facebookLogin().catch(() => setLoadingProvider(null));
                }}
              >
                {loadingProvider === "facebook" ? (
                  <ActivityIndicator size="sm" />
                ) : (
                  <Text>Sign in with Facebook</Text>
                )}
              </Button>

              {/* Apple */}
              {Platform.OS === "ios" && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
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
                  onPress={handleAppleLogin}
                />
              )}
            </View>

            <View className="flex-row items-center mb-8">
              <View className="flex-1 h-[1px] bg-border" />
              <Text className="mx-4 text-muted-foreground text-xs uppercase">
                Or continue with email
              </Text>
              <View className="flex-1 h-[1px] bg-border" />
            </View>

            {/* Email Form */}
            <View className="space-y-4">
              <View>
                <Text className="mb-2 text-sm font-medium">Email</Text>
                <TextInput
                  placeholder="name@example.com"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
                />
                {email.length > 0 && !isValidEmail(email) && (
                  <Text className="text-destructive text-xs mt-1 ml-1">Invalid email format</Text>
                )}
              </View>

              <View>
                <Text className="mb-2 text-sm font-medium">Password</Text>
                <View className="flex-row items-center rounded-xl border border-border bg-card px-4 py-3">
                  <TextInput
                    placeholder="Enter password"
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={password}
                    onChangeText={setPassword}
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
              </View>
            </View>

            <Button
              variant="link"
              className="self-end mt-2"
              onPress={() => router.push("/auth/forgot-password")}
            >
              <Text className="text-sm">Forgot Password?</Text>
            </Button>

            <Button
              className="mt-6 h-12"
              onPress={handleEmailLogin}
              disabled={!isLoginFormValid || !!loadingProvider}
            >
              {loadingProvider === "email" ? (
                <ActivityIndicator color={theme.colors.primaryForeground} />
              ) : (
                <Text className="font-bold">Log In</Text>
              )}
            </Button>

            <View className="flex-row items-center justify-center mt-6">
              <Text className="text-muted-foreground">Don't have an account? </Text>
              <Button variant="link" className="p-0" onPress={() => router.push("/auth/signup")}>
                <Text className="font-bold">Sign Up</Text>
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
