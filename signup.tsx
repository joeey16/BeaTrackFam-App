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
import { useCustomerCreate } from "~/lib/shopify/hooks";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useOnboarding } from "~/lib/contexts/OnboardingContext";
import { useTheme } from "~/theming/ThemeProvider";
import { router } from "expo-router";
import LucideIcon from "~/lib/icons/LucideIcon";

export default function SignUpScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const { completeWelcome } = useOnboarding();
  const customerCreate = useCustomerCreate();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      const result = await customerCreate.mutateAsync({
        email,
        password,
        firstName,
        lastName,
      });
      await login(result.accessToken);
      await completeWelcome();
      Alert.alert("Success", "Account created successfully");
      router.replace("/(tabs)/account");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create account");
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
              <Text className="text-h1 mb-2 font-bold text-foreground">Create Account</Text>
              <Text className="text-base text-muted-foreground">
                Join BeaTrackFam - Loyalty Above All
              </Text>
            </View>

            {/* First Name */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">First Name</Text>
              <View className="rounded-xl border border-border bg-card px-4 py-3">
                <TextInput
                  placeholder="Enter your first name"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  className="text-base text-foreground"
                  style={{ fontFamily: theme.typography.body?.fontFamily }}
                />
              </View>
            </View>

            {/* Last Name */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">Last Name</Text>
              <View className="rounded-xl border border-border bg-card px-4 py-3">
                <TextInput
                  placeholder="Enter your last name"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  className="text-base text-foreground"
                  style={{ fontFamily: theme.typography.body?.fontFamily }}
                />
              </View>
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
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">Password</Text>
              <View className="flex-row items-center rounded-xl border border-border bg-card px-4 py-3">
                <TextInput
                  placeholder="Create a password (min 6 characters)"
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

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-foreground">Confirm Password</Text>
              <View className="flex-row items-center rounded-xl border border-border bg-card px-4 py-3">
                <TextInput
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 text-base text-foreground"
                  style={{ fontFamily: theme.typography.body?.fontFamily }}
                />
              </View>
            </View>

            {/* Sign Up Button */}
            <Button onPress={handleSignUp} disabled={customerCreate.isPending} className="mb-4">
              {customerCreate.isPending ? (
                <ActivityIndicator color={theme.colors.primaryForeground} />
              ) : (
                <Text>Create Account</Text>
              )}
            </Button>

            {/* Login Link */}
            <View className="flex-row items-center justify-center">
              <Text className="text-muted-foreground">Already have an account? </Text>
              <Button variant="link" onPress={() => router.push("/auth/login")}>
                <Text>Log In</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
