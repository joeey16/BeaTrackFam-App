import * as React from "react";
import { View, ScrollView, Pressable, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import LucideIcon from "~/lib/icons/LucideIcon";
import { useTheme } from "~/theming/ThemeProvider";
function SupportOption({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 flex-row items-center rounded-2xl bg-card p-4 border border-border active:bg-muted"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary mr-4">
        <LucideIcon name={icon} size={24} color={theme.colors.primaryForeground} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        <Text className="text-sm text-muted-foreground">{subtitle}</Text>
      </View>
      <LucideIcon name="ChevronRight" size={20} color={theme.colors.mutedForeground} />
    </Pressable>
  );
}
export default function SupportScreen() {
  const { theme } = useTheme();
  const handleEmail = () => {
    Linking.openURL("mailto:contact.beatrackfam@gmail.com?subject=Support Request");
  };
  const handlePhone = () => {
    Alert.alert("Contact Support", "Call us at:\n\n(347) 308-1263\n\nHours: Mon-Fri 9AM-6PM EST", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call Now",
        onPress: () => Linking.openURL("tel:3473081263"),
      },
    ]);
  };
  const handleLiveChat = () => {
    Linking.openURL("sms:3473081263");
  };
  const handleReturns = async () => {
    const url = "https://beatrackfam.info/policies/refund-policy";
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert(
        "Returns & Exchanges",
        "We accept returns within 30 days of purchase. Contact support for assistance.",
      );
    }
  };
  const handleShipping = () => {
    Alert.alert(
      "Shipping Information",
      "Worldwide Shipping Available:\n\n" +
        "Standard Shipping: $5.99\n" +
        "Expedited Shipping: $9.99\n" +
        "Premium Shipping: $20.99",
      [{ text: "OK" }],
    );
  };
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-h2 mb-2 font-bold text-foreground">Support Center</Text>
          <Text className="text-base text-muted-foreground">
            We're here to help with your BeaTrackFam experience
          </Text>
        </View>
        {/* Quick Contact */}
        <View className="mb-6 rounded-2xl bg-primary p-6">
          <View className="mb-4 flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20 mr-3">
              <LucideIcon name="Headset" size={24} color={theme.colors.primaryForeground} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-primary-foreground">Need Help?</Text>
              <Text className="text-sm text-primary-foreground/80">We're here for you</Text>
            </View>
          </View>
          <Button onPress={handleEmail} className="w-full bg-primary-foreground">
            <View className="flex-row items-center">
              <LucideIcon name="Mail" size={20} color={theme.colors.primary} />
              <Text className="ml-2 text-primary">Email Support</Text>
            </View>
          </Button>
        </View>
        {/* Support Options */}
        <View className="mb-6">
          <Text className="mb-3 px-1 text-sm font-semibold text-muted-foreground">
            CONTACT OPTIONS
          </Text>
          <SupportOption
            icon="Phone"
            title="Call Us"
            subtitle="Mon-Fri 9AM-6PM EST"
            onPress={handlePhone}
          />
          <SupportOption
            icon="MessageCircle"
            title="Text Us"
            subtitle="Send us a text message"
            onPress={handleLiveChat}
          />
        </View>
        {/* Help Topics */}
        <View className="mb-6">
          <Text className="mb-3 px-1 text-sm font-semibold text-muted-foreground">HELP TOPICS</Text>
          <SupportOption
            icon="Package"
            title="Track My Order"
            subtitle="Check your order status"
            onPress={() =>
              Alert.alert(
                "Track Order",
                "Go to Order History in your Account tab to track your orders",
              )
            }
          />
          <SupportOption
            icon="RotateCcw"
            title="Returns & Exchanges"
            subtitle="30-day return policy"
            onPress={handleReturns}
          />
          <SupportOption
            icon="Truck"
            title="Shipping Information"
            subtitle="Worldwide shipping rates"
            onPress={handleShipping}
          />
        </View>
        {/* Additional Info */}
        <View className="rounded-2xl bg-card p-4 border border-border mb-6">
          <Text className="mb-3 text-base font-semibold text-foreground">Business Hours</Text>
          <View className="mb-2 flex-row items-center">
            <LucideIcon name="Clock" size={16} color={theme.colors.mutedForeground} />
            <Text className="ml-2 text-sm text-muted-foreground">
              Monday - Friday: 9:00 AM - 6:00 PM EST
            </Text>
          </View>
          <View className="mb-2 flex-row items-center">
            <LucideIcon name="Clock" size={16} color={theme.colors.mutedForeground} />
            <Text className="ml-2 text-sm text-muted-foreground">
              Saturday: 10:00 AM - 4:00 PM EST
            </Text>
          </View>
          <View className="flex-row items-center">
            <LucideIcon name="Clock" size={16} color={theme.colors.mutedForeground} />
            <Text className="ml-2 text-sm text-muted-foreground">Sunday: Closed</Text>
          </View>
        </View>
        {/* Email Direct */}
        <View className="rounded-2xl bg-muted p-4 mb-6">
          <Text className="mb-2 text-base font-semibold text-foreground">Email Us Directly</Text>
          <Pressable onPress={handleEmail}>
            <Text className="text-sm font-mono text-primary">contact.beatrackfam@gmail.com</Text>
          </Pressable>
        </View>
        {/* Brand Message */}
        <View className="items-center py-6">
          <Text className="text-center text-sm text-muted-foreground mb-2">
            BeaTrackFam - Loyalty Above All
          </Text>
          <Text className="text-center text-xs text-muted-foreground">
            We're a family, and we take care of our own
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
