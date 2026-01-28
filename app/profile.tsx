import * as React from "react";
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/contexts/AuthContext";
import { useCustomer, useCustomerUpdate } from "~/lib/shopify/hooks";
import { usePreferences } from "~/lib/contexts/PreferencesContext";
import { useTheme } from "~/theming/ThemeProvider";
import { router, Stack, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LucideIcon from "~/lib/icons/LucideIcon";

const PROFILE_PICTURE_KEY = "@beatrackfam:profile_picture";
const MARKETING_PREF_KEY = "@beatrackfam:accepts_marketing";

// Common sizes and device models
const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const DEVICE_MODELS = [
  "iPhone 12",
  "iPhone 13",
  "iPhone 14",
  "iPhone 15",
  "iPhone 16",
  "Galaxy S23",
  "Galaxy S24",
  "Pixel 8",
  "Pixel 9",
];

// Common countries with phone codes
const COUNTRY_CODES = [
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
];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { accessToken, login } = useAuth();
  const { data: customer, isLoading: isLoadingCustomer } = useCustomer(accessToken);
  const customerUpdate = useCustomerUpdate();
  const { preferences, updatePreferences } = usePreferences();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("+1");
  const [showCountryPicker, setShowCountryPicker] = React.useState(false);
  const [acceptsMarketing, setAcceptsMarketing] = React.useState(false);
  const [profilePicture, setProfilePicture] = React.useState<string | null>(null);
  const [defaultSize, setDefaultSize] = React.useState<string | null>(null);
  const [defaultDeviceModel, setDefaultDeviceModel] = React.useState<string | null>(null);
  const [showSavedBanner, setShowSavedBanner] = React.useState(false);
  const hasInitializedCustomer = React.useRef(false);
  const [marketingPrefLoaded, setMarketingPrefLoaded] = React.useState(false);
  const [storedAcceptsMarketing, setStoredAcceptsMarketing] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    hasInitializedCustomer.current = false;
  }, [accessToken]);

  const loadMarketingPreference = React.useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(MARKETING_PREF_KEY);
      if (stored !== null) {
        setStoredAcceptsMarketing(stored === "true");
      }
    } catch (error) {
      console.error("Failed to load marketing preference:", error);
    } finally {
      setMarketingPrefLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    loadMarketingPreference();
  }, [loadMarketingPreference]);

  useFocusEffect(
    React.useCallback(() => {
      loadMarketingPreference();
    }, [loadMarketingPreference]),
  );

  React.useEffect(() => {
    if (storedAcceptsMarketing !== null) {
      setAcceptsMarketing(storedAcceptsMarketing);
    }
  }, [storedAcceptsMarketing]);

  // Initialize form with customer data
  React.useEffect(() => {
    if (customer && marketingPrefLoaded && !hasInitializedCustomer.current) {
      setFirstName(customer.firstName || "");
      setLastName(customer.lastName || "");
      setEmail(customer.email || "");

      // Parse phone number to extract country code if present
      const customerPhone = customer.phone || "";
      if (customerPhone) {
        // Try to find matching country code
        const matchedCode = COUNTRY_CODES.find((c) => customerPhone.startsWith(c.code));
        if (matchedCode) {
          setCountryCode(matchedCode.code);
          setPhone(customerPhone.substring(matchedCode.code.length).trim());
        } else {
          setPhone(customerPhone);
        }
      }

      if (storedAcceptsMarketing !== null) {
        setAcceptsMarketing(storedAcceptsMarketing);
      } else {
        setAcceptsMarketing(customer.acceptsMarketing || false);
      }
      hasInitializedCustomer.current = true;
    }
  }, [customer, marketingPrefLoaded, storedAcceptsMarketing]);

  // Load profile picture and preferences
  React.useEffect(() => {
    loadProfilePicture();
    setDefaultSize(preferences.defaultSize);
    setDefaultDeviceModel(preferences.defaultDeviceModel);
  }, [preferences]);

  const loadProfilePicture = async () => {
    try {
      const uri = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
      if (uri) {
        setProfilePicture(uri);
      }
    } catch (error) {
      console.error("Failed to load profile picture:", error);
    }
  };

  const handleMarketingToggle = async () => {
    const nextValue = !acceptsMarketing;
    setAcceptsMarketing(nextValue);
    setStoredAcceptsMarketing(nextValue);
    try {
      await AsyncStorage.setItem(MARKETING_PREF_KEY, nextValue ? "true" : "false");
    } catch (error) {
      console.error("Failed to persist marketing preference:", error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to upload a profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImageUri = result.assets[0].uri;
        setProfilePicture(newImageUri);
        // Immediately save to AsyncStorage so it updates everywhere
        await AsyncStorage.setItem(PROFILE_PICTURE_KEY, newImageUri);
      }
    } catch (error) {
      // Handle case where native module isn't available yet
      if (Platform.OS === "web") {
        Alert.alert("Error", "Image picker is not available on web. Please use mobile device.");
      } else {
        Alert.alert(
          "Loading",
          "Image picker is loading. Please try refreshing the app or try again in a moment.",
        );
      }
      console.error("Image picker error:", error);
    }
  };

  const removeProfilePicture = () => {
    Alert.alert("Remove Photo", "Are you sure you want to remove your profile picture?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setProfilePicture(null);
          // Immediately remove from AsyncStorage so it updates everywhere
          await AsyncStorage.removeItem(PROFILE_PICTURE_KEY);
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!accessToken) {
      Alert.alert("Error", "You must be logged in to update your profile");
      return;
    }

    if (!firstName || !lastName || !email) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      console.log("Saving profile...");
      console.log("Phone:", phone, "Country Code:", countryCode);
      console.log("Preferences - Size:", defaultSize, "Device:", defaultDeviceModel);

      // Format phone number for Shopify (E.164 format: +[country code][number])
      // Remove any non-digit characters from phone input
      const cleanPhone = phone ? phone.replace(/\D/g, "") : "";

      // Validate phone number length for US/Canada (10 digits)
      let fullPhone: string | undefined = undefined;
      if (cleanPhone) {
        if (
          (countryCode === "+1" && cleanPhone.length === 10) ||
          (countryCode !== "+1" && cleanPhone.length >= 7)
        ) {
          // Pure E.164 format - no spaces, no dashes, just +[code][number]
          // Example: +13473081263
          fullPhone = `${countryCode}${cleanPhone}`;
        } else if (cleanPhone.length > 0) {
          // Invalid phone number length - skip it to allow profile save
          console.warn(`Phone number length ${cleanPhone.length} is invalid for ${countryCode}`);
          fullPhone = undefined;
        }
      }
      console.log("Formatted phone (E.164):", fullPhone);

      // Build customer update object
      const customerData: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        acceptsMarketing: boolean;
      } = {
        firstName,
        lastName,
        email,
        acceptsMarketing,
      };

      // Only add phone if it's valid
      if (fullPhone) {
        customerData.phone = fullPhone;
      }

      let result: { accessToken: string } | null = null;
      let phoneWasSkipped = false;

      try {
        result = await customerUpdate.mutateAsync({
          accessToken,
          customer: customerData,
        });
        console.log("Customer update successful", result);
      } catch (phoneError) {
        // If phone validation fails, try again without phone
        if (
          phoneError instanceof Error &&
          (phoneError.message.includes("Phone is invalid") ||
            phoneError.message.includes("Phone has already been taken"))
        ) {
          console.log("Phone validation failed, retrying without phone...");
          const { phone: _, ...customerDataWithoutPhone } = customerData;
          phoneWasSkipped = true;

          try {
            result = await customerUpdate.mutateAsync({
              accessToken,
              customer: customerDataWithoutPhone,
            });
            console.log("Customer update successful (without phone)", result);
          } catch (retryError) {
            console.error("Retry without phone also failed:", retryError);
            throw retryError;
          }
        } else {
          throw phoneError;
        }
      }

      // Update the auth token if it changed
      console.log("Checking result for accessToken:", result);
      if (result && typeof result === "object" && "accessToken" in result && result.accessToken) {
        console.log("Updating auth token with:", result.accessToken);
        await login(result.accessToken);
      } else {
        console.log("No accessToken in result, using existing accessToken");
      }

      // Save profile picture to AsyncStorage
      if (profilePicture) {
        await AsyncStorage.setItem(PROFILE_PICTURE_KEY, profilePicture);
        console.log("Profile picture saved");
      } else {
        await AsyncStorage.removeItem(PROFILE_PICTURE_KEY);
      }

      // Save marketing preference locally to keep the toggle stable across refreshes
      await AsyncStorage.setItem(MARKETING_PREF_KEY, acceptsMarketing ? "true" : "false");
      setStoredAcceptsMarketing(acceptsMarketing);

      // Save preferences
      await updatePreferences({
        defaultSize,
        defaultDeviceModel,
      });
      console.log("Preferences saved successfully");

      // Show saved banner
      setShowSavedBanner(true);

      // Show alert if phone was skipped
      if (phoneWasSkipped) {
        Alert.alert(
          "Profile Saved",
          "Your profile and preferences were saved successfully, but the phone number could not be updated.",
        );
      }

      // Hide banner after 3 seconds
      setTimeout(() => {
        setShowSavedBanner(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update profile");
    }
  };

  if (isLoadingCustomer) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <Stack.Screen options={{ title: "Edit Profile" }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <Stack.Screen options={{ title: "Edit Profile" }} />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-muted-foreground">
            Please log in to view your profile
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: "Edit Profile" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="py-6">
            {/* Profile Picture */}
            <View className="mb-6 items-center">
              <Pressable onPress={pickImage} className="mb-3">
                <View className="relative">
                  {profilePicture ? (
                    <Image
                      key={profilePicture}
                      source={{ uri: profilePicture }}
                      style={{ width: 120, height: 120, borderRadius: 60 }}
                    />
                  ) : (
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: `${theme.colors.primary}20`,
                      }}
                    >
                      <LucideIcon name="User" size={48} color={theme.colors.primary} />
                    </View>
                  )}
                  <View
                    className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full border-2 bg-primary"
                    style={{ borderColor: theme.colors.background }}
                  >
                    <LucideIcon name="Camera" size={20} color={theme.colors.primaryForeground} />
                  </View>
                </View>
              </Pressable>
              <View className="flex-row items-center">
                <Button variant="ghost" size="sm" onPress={pickImage}>
                  <Text className="text-sm text-primary">
                    {profilePicture ? "Change Photo" : "Add Photo"}
                  </Text>
                </Button>
                {profilePicture && (
                  <>
                    <Text className="text-sm text-muted-foreground"> • </Text>
                    <Button variant="ghost" size="sm" onPress={removeProfilePicture}>
                      <Text className="text-sm text-destructive">Remove</Text>
                    </Button>
                  </>
                )}
              </View>
            </View>

            {/* First Name */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">
                First Name <Text className="text-destructive">*</Text>
              </Text>
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
              <Text className="mb-2 text-sm font-medium text-foreground">
                Last Name <Text className="text-destructive">*</Text>
              </Text>
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
              <Text className="mb-2 text-sm font-medium text-foreground">
                Email <Text className="text-destructive">*</Text>
              </Text>
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

            {/* Phone */}
            <View className="mb-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">
                  Phone (Optional - Leave empty to skip)
                </Text>
                {phone && (
                  <Pressable onPress={() => setPhone("")}>
                    <Text className="text-xs text-primary">Clear</Text>
                  </Pressable>
                )}
              </View>
              <View className="flex-row">
                {/* Country Code Selector */}
                <Pressable
                  onPress={() => setShowCountryPicker(!showCountryPicker)}
                  className="mr-2 rounded-xl border border-border bg-card px-3 py-3"
                  style={{ minWidth: 90 }}
                >
                  <View className="flex-row items-center">
                    <Text className="text-base mr-1">
                      {COUNTRY_CODES.find((c) => c.code === countryCode)?.flag || "🌎"}
                    </Text>
                    <Text className="text-base text-foreground mr-1">{countryCode}</Text>
                    <LucideIcon
                      name={showCountryPicker ? "ChevronUp" : "ChevronDown"}
                      size={16}
                      color={theme.colors.mutedForeground}
                    />
                  </View>
                </Pressable>

                {/* Phone Input */}
                <View className="flex-1 rounded-xl border border-border bg-card px-4 py-3">
                  <TextInput
                    placeholder="1234567890"
                    placeholderTextColor={theme.colors.mutedForeground}
                    value={phone}
                    onChangeText={(text) => {
                      // Only allow digits
                      const cleaned = text.replace(/\D/g, "");
                      setPhone(cleaned);
                    }}
                    keyboardType="phone-pad"
                    maxLength={15}
                    className="text-base text-foreground"
                    style={{ fontFamily: theme.typography.body?.fontFamily }}
                  />
                </View>
              </View>

              {/* Country Picker Dropdown */}
              {showCountryPicker && (
                <View className="mt-2 rounded-xl border border-border bg-card max-h-60">
                  <ScrollView>
                    {COUNTRY_CODES.map((country, index) => (
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
                        <Text className="text-sm text-foreground flex-1">{country.country}</Text>
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

            {/* Preferences Section Header */}
            <View className="mb-4 mt-6">
              <Text className="text-sm font-semibold text-muted-foreground px-1">
                SHOPPING PREFERENCES
              </Text>
              <Text className="text-xs text-muted-foreground px-1 mt-1">
                Auto-select your preferred options on product pages
              </Text>
            </View>

            {/* Default Size */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">Default Size</Text>
              <View className="flex-row flex-wrap">
                {SIZES.map((size) => {
                  const isSelected = defaultSize === size;
                  return (
                    <Pressable
                      key={size}
                      onPress={() => setDefaultSize(isSelected ? null : size)}
                      className={`mr-3 mb-3 rounded-xl border-2 px-4 py-2 ${
                        isSelected ? "border-primary bg-primary/10" : "border-border bg-card"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Default Device Model */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-foreground">Default Device Model</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
                {DEVICE_MODELS.map((model) => {
                  const isSelected = defaultDeviceModel === model;
                  return (
                    <Pressable
                      key={model}
                      onPress={() => setDefaultDeviceModel(isSelected ? null : model)}
                      className={`mr-3 mb-3 rounded-xl border-2 px-4 py-2 ${
                        isSelected ? "border-primary bg-primary/10" : "border-border bg-card"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {model}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Marketing Toggle */}
            <View className="mb-6">
              <Button
                variant="ghost"
                onPress={handleMarketingToggle}
                className="flex-row items-center justify-start px-4"
              >
                <View
                  className="mr-3 h-6 w-6 items-center justify-center rounded border-2"
                  style={{
                    borderColor: acceptsMarketing
                      ? theme.colors.primary
                      : theme.colors.mutedForeground,
                    backgroundColor: acceptsMarketing ? theme.colors.primary : "transparent",
                  }}
                >
                  {acceptsMarketing && (
                    <Text className="text-xs font-bold text-primary-foreground">✓</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-foreground">Receive marketing emails</Text>
                  <Text className="text-xs text-muted-foreground">
                    Get updates on new drops and exclusive offers
                  </Text>
                </View>
              </Button>
            </View>

            {/* Save Button */}
            <Button
              onPress={handleSave}
              disabled={customerUpdate.isPending}
              size="lg"
              className="mb-4"
            >
              {customerUpdate.isPending ? (
                <ActivityIndicator color={theme.colors.primaryForeground} />
              ) : (
                <Text className="font-semibold">Save Changes</Text>
              )}
            </Button>

            {/* Cancel Button */}
            <Button onPress={() => router.back()} variant="ghost">
              <Text className="text-foreground">Cancel</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Saved Banner */}
      {showSavedBanner && (
        <View className="absolute top-16 left-4 right-4" style={{ zIndex: 9999 }}>
          <View
            className="flex-row items-center rounded-xl px-4 py-3 shadow-lg"
            style={{
              backgroundColor: theme.colors.primary,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <LucideIcon name="CircleCheck" size={20} color={theme.colors.primaryForeground} />
            <View className="ml-3 flex-1">
              <Text className="font-semibold" style={{ color: theme.colors.primaryForeground }}>
                Changes Saved Successfully!
              </Text>
              <Text
                className="text-xs"
                style={{ color: theme.colors.primaryForeground, opacity: 0.95 }}
              >
                Your profile and preferences have been updated
              </Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
