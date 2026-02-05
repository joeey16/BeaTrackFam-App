import * as React from "react";
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useCustomerLogin } from "~/lib/shopify/hooks";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useOnboarding } from "~/lib/contexts/OnboardingContext";
import { useTheme } from "~/theming/ThemeProvider";
import { router } from "expo-router";
import LucideIcon from "~/lib/icons/LucideIcon";

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const { completeWelcome } = useOnboarding();
  const customerLogin = useCustomerLogin();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const result = await customerLogin.mutateAsync({ email, password });
      await login(result.accessToken);
      await completeWelcome();
      Alert.alert("Success", "Logged in successfully");
      router.replace("/(tabs)/account");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to log in");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="py-8">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-h1 mb-2 font-bold text-foreground">Welcome Back</Text>
              <Text className="text-base text-muted-foreground">
                Log in to your BeaTrackFam account
              </Text>
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">Email</Text>
              <View className="rounded-xl border border-border bg-card px-4 py-3">
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="text-base text-foreground"
                  style={{ fontFamily: theme.typography.body?.fontFamily }}
                />
              </View>
            </View>

            {/* Password */}
            <View className="mb-2">
              <Text className="mb-2 text-sm font-medium text-foreground">Password</Text>
              <View className="flex-row items-center rounded-xl border border-border bg-card px-4 py-3">
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 text-base text-foreground"
                  style={{ fontFamily: theme.typography.body?.fontFamily }}
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

            {/* Forgot Password Link */}
            <View className="mb-6 items-end">
              <Button variant="link" size="sm" onPress={() => router.push("/auth/forgot-password")}>
                <Text className="text-sm">Forgot Password?</Text>
              </Button>
            </View>

            {/* Login Button */}
            <Button onPress={handleLogin} disabled={customerLogin.isPending} className="mb-4">
              {customerLogin.isPending ? (
                <ActivityIndicator color={theme.colors.primaryForeground} />
              ) : (
                <Text>Log In</Text>
              )}
            </Button>

            {/* Sign Up Link */}
            <View className="flex-row items-center justify-center">
              <Text className="text-muted-foreground">Don't have an account? </Text>
              <Button variant="link" onPress={() => router.push("/auth/signup")}>
                <Text>Sign Up</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
