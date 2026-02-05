import * as React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import LucideIcon from "~/lib/icons/LucideIcon";

export default function ThankYouScreen() {
  const params = useLocalSearchParams<{
    orderNumber?: string;
    orderId?: string;
    total?: string;
  }>();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: "Thank You" }} />
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        <View className="items-center rounded-3xl bg-card p-6">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <LucideIcon name="CheckCircle" size={36} color="#16A34A" />
          </View>
          <Text className="text-h2 mb-2 font-bold text-foreground">Thank you for your order!</Text>
          <Text className="text-center text-sm text-muted-foreground">
            Your payment was approved and your order has been placed successfully.
          </Text>
          {params.orderNumber ? (
            <View className="mt-4 rounded-xl bg-muted px-4 py-3">
              <Text className="text-sm text-muted-foreground">Order number</Text>
              <Text className="text-lg font-semibold text-foreground">#{params.orderNumber}</Text>
            </View>
          ) : null}
          {params.total ? (
            <View className="mt-3 rounded-xl bg-muted px-4 py-3">
              <Text className="text-sm text-muted-foreground">Total paid</Text>
              <Text className="text-lg font-semibold text-foreground">{params.total}</Text>
            </View>
          ) : null}
        </View>
        <View className="mt-6 gap-3">
          <Button onPress={() => router.replace("/orders")}>
            <Text>View My Orders</Text>
          </Button>
          <Button variant="outline" onPress={() => router.replace("/(tabs)")}>
            <Text>Continue Shopping</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
