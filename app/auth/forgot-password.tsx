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
import { useCustomerRecover } from "~/lib/shopify/hooks";
import { useTheme } from "~/theming/ThemeProvider";
import { router } from "expo-router";
import LucideIcon from "~/lib/icons/LucideIcon";

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const customerRecover = useCustomerRecover();

  const [email, setEmail] = React.useState("");
  const [emailSent, setEmailSent] = React.useState(false);

  const handleRecover = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      await customerRecover.mutateAsync({ email });
      setEmailSent(true);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to send reset email");
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="flex-1 items-center justify-center py-16">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <LucideIcon name="Mail" size={40} color={theme.colors.primary} />
            </View>

            <Text className="text-h2 mb-4 text-center font-bold text-foreground">
              Check Your Email
            </Text>
            <Text className="mb-8 text-center text-base text-muted-foreground">
              We've sent password reset instructions to{"\n"}
              <Text className="font-semibold text-foreground">{email}</Text>
            </Text>

            <Button onPress={() => router.back()} className="mb-4 w-full">
              <Text>Back to Login</Text>
            </Button>

            <Button
              variant="ghost"
              onPress={() => {
                setEmailSent(false);
                setEmail("");
              }}
            >
              <Text className="text-black dark:text-foreground">Try Different Email</Text>
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="py-8">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
              className="mb-6 self-start"
            >
              <View className="flex-row items-center">
                <LucideIcon name="ChevronLeft" size={20} color={theme.colors.foreground} />
                <Text className="ml-1 text-foreground">Back</Text>
              </View>
            </Button>

            {/* Header */}
            <View className="mb-8">
              <Text className="text-h1 mb-2 font-bold text-foreground">Forgot Password?</Text>
              <Text className="text-base text-muted-foreground">
                Enter your email address and we'll send you instructions to reset your password.
              </Text>
            </View>

            {/* Email */}
            <View className="mb-6">
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
                  autoFocus
                  className="text-base text-foreground"
                  style={{ fontFamily: theme.typography.body?.fontFamily }}
                />
              </View>
            </View>

            {/* Reset Button */}
            <Button onPress={handleRecover} disabled={customerRecover.isPending}>
              {customerRecover.isPending ? (
                <ActivityIndicator color={theme.colors.primaryForeground} />
              ) : (
                <Text>Send Reset Link</Text>
              )}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
