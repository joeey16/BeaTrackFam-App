import * as React from "react";
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useTheme } from "~/theming/ThemeProvider";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useCustomer } from "~/lib/shopify/hooks";
import { router, Stack } from "expo-router";
import LucideIcon from "~/lib/icons/LucideIcon";

export default function CustomRequestScreen() {
  const { theme } = useTheme();
  const { accessToken } = useAuth();
  const { data: customer } = useCustomer(accessToken);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [productType, setProductType] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Pre-fill customer data if logged in
  React.useEffect(() => {
    if (customer) {
      setName(customer.displayName || "");
      setEmail(customer.email || "");
    }
  }, [customer]);

  const handleSubmit = async () => {
    if (!name || !email || !description) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Send request to backend or email service
      console.log("Custom Request:", { name, email, productType, description, budget });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        "Request Submitted!",
        "Thank you for your custom design request. We'll review it and get back to you within 24-48 hours at " +
          email,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );

      // Reset form
      setProductType("");
      setDescription("");
      setBudget("");
    } catch (error) {
      Alert.alert("Error", "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <Stack.Screen options={{ title: "Custom Design Request", headerBackTitle: "Back" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="py-6">
            {/* Header */}
            <View className="mb-6 items-center">
              <View
                className="h-16 w-16 items-center justify-center rounded-full mb-3"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <LucideIcon name="Palette" size={32} color={theme.colors.primaryForeground} />
              </View>
              <Text className="text-2xl font-bold text-foreground text-center mb-2">
                Design Your Own
              </Text>
              <Text className="text-sm text-muted-foreground text-center">
                Share your vision and we'll bring it to life
              </Text>
            </View>

            {/* Form */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">
                Name <Text className="text-destructive">*</Text>
              </Text>
              <View className="rounded-xl border border-border bg-card px-4 py-3">
                <TextInput
                  placeholder="Your name"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  className="text-base text-foreground"
                  style={{ fontFamily: theme.typography.body?.fontFamily }}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">
                Email <Text className="text-destructive">*</Text>
              </Text>
              <View className="rounded-xl border border-border bg-card px-4 py-3">
                <TextInput
                  placeholder="your@email.com"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="text-base text-foreground"
                  style={{ fontFamily: theme.typography.body?.fontFamily }}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">Product Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {["T-Shirt", "Hoodie", "Phone Case", "Hat", "Accessories", "Other"].map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setProductType(type)}
                    className={`px-4 py-2 rounded-lg ${
                      productType === type ? "bg-primary" : "bg-card border border-border"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        productType === type ? "text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">
                Design Description <Text className="text-destructive">*</Text>
              </Text>
              <View className="rounded-xl border border-border bg-card px-4 py-3">
                <TextInput
                  placeholder="Describe your custom design idea, colors, style, inspiration, etc."
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  className="text-base text-foreground min-h-32"
                  style={{ fontFamily: theme.typography.body?.fontFamily }}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-foreground">Budget (Optional)</Text>
              <View className="rounded-xl border border-border bg-card px-4 py-3">
                <TextInput
                  placeholder="$50 - $200"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={budget}
                  onChangeText={setBudget}
                  className="text-base text-foreground"
                  style={{ fontFamily: theme.typography.body?.fontFamily }}
                />
              </View>
            </View>

            {/* Info Card */}
            <View className="mb-6 rounded-xl bg-muted p-4">
              <View className="flex-row items-start">
                <LucideIcon name="Info" size={20} color={theme.colors.primary} />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-1">
                    What happens next?
                  </Text>
                  <Text className="text-xs text-muted-foreground leading-5">
                    Our design team will review your request and reach out within 24-48 hours to
                    discuss your vision, pricing, and timeline. We'll work closely with you to
                    create something truly unique!
                  </Text>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <Button
              onPress={handleSubmit}
              disabled={!name || !email || !description || isSubmitting}
              size="lg"
              className="mb-4"
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.primaryForeground} />
              ) : (
                <Text className="font-semibold">Submit Request</Text>
              )}
            </Button>

            <Button onPress={() => router.back()} variant="ghost">
              <Text className="text-foreground">Cancel</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
