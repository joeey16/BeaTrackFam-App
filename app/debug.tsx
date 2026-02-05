import * as React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import Constants from "expo-constants";
import { getProducts } from "~/lib/shopify/client";
export default function DebugScreen() {
  const [testResult, setTestResult] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const domainFromEnv = process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN;
  const domainFromConfig = Constants.expoConfig?.extra?.EXPO_PUBLIC_SHOPIFY_DOMAIN;
  const tokenFromEnv = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const tokenFromConfig = Constants.expoConfig?.extra?.EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const domain = domainFromEnv || domainFromConfig;
  const token = tokenFromEnv || tokenFromConfig;
  const testConnection = async () => {
    setIsLoading(true);
    setTestResult("Testing connection...");
    try {
      // First check if credentials exist
      if (!domain || !token) {
        setTestResult(
          `❌ Credentials missing:\nDomain: ${domain || "NOT SET"}\nToken: ${token ? "SET" : "NOT SET"}`,
        );
        setIsLoading(false);
        return;
      }
      setTestResult(
        `Testing Shopify API...\n\nDomain: ${domain}\nToken: ${token.substring(0, 15)}...\n\nTrying to fetch products...`,
      );
      const result = await getProducts(1);
      setTestResult(
        `✅ SUCCESS! Found ${result.products.length} products.\n\nFirst product: ${result.products[0]?.title || "N/A"}\n\nYour Shopify integration is working!`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Parse the error to give helpful advice
      let advice = "";
      if (errorMessage.includes("401")) {
        advice =
          '\n\n🔧 FIX: Your token is invalid or missing permissions.\n\n1. Go to Shopify admin → Settings → Apps → Develop apps\n2. Click your app → Configuration tab\n3. Under "Storefront API integration", click Configure\n4. Enable ALL unauthenticated scopes\n5. Save, then go to API credentials tab\n6. Copy the NEW Storefront API access token\n7. Update EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN';
      } else if (errorMessage.includes("404")) {
        advice = "\n\n🔧 FIX: API endpoint not found. The Storefront API might not be enabled.";
      }
      setTestResult(`❌ ERROR:\n\n${errorMessage}${advice}`);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView className="flex-1 px-4 py-6">
        <Text className="text-h2 mb-6 font-bold text-foreground">Shopify Debug</Text>
        <View className="mb-6 rounded-2xl bg-card p-4">
          <Text className="mb-2 text-sm font-semibold text-foreground">Environment Variables:</Text>
          <Text className="mb-2 text-xs text-muted-foreground">EXPO_PUBLIC_SHOPIFY_DOMAIN:</Text>
          <Text className="mb-1 text-sm text-foreground font-mono">{domain || "❌ NOT SET"}</Text>
          <Text className="mb-4 text-xs text-muted-foreground">
            From process.env: {domainFromEnv ? "✅" : "❌"} | From config:{" "}
            {domainFromConfig ? "✅" : "❌"}
          </Text>
          <Text className="mb-2 text-xs text-muted-foreground">
            EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN:
          </Text>
          <Text className="mb-1 text-sm text-foreground font-mono">
            {token ? `${token.substring(0, 20)}...` : "❌ NOT SET"}
          </Text>
          <Text className="mb-2 text-xs text-muted-foreground">
            From process.env: {tokenFromEnv ? "✅" : "❌"} | From config:{" "}
            {tokenFromConfig ? "✅" : "❌"}
          </Text>
          {token && (
            <Text className="text-xs text-muted-foreground">
              Token length: {token.length} characters
            </Text>
          )}
        </View>
        <View className="mb-6 rounded-2xl bg-card p-4">
          <Text className="mb-2 text-sm font-semibold text-foreground">API URL:</Text>
          <Text className="text-sm text-foreground font-mono">
            {domain ? `https://${domain}/api/2024-01/graphql.json` : "❌ Domain not set"}
          </Text>
        </View>
        <Button onPress={testConnection} disabled={isLoading} className="mb-4">
          <Text>{isLoading ? "Testing..." : "Test Connection"}</Text>
        </Button>
        {testResult && (
          <View className="rounded-2xl bg-muted p-4">
            <Text className="text-sm text-foreground font-mono whitespace-pre-wrap">
              {testResult}
            </Text>
          </View>
        )}
        <View className="mt-6 rounded-2xl bg-yellow-100 dark:bg-yellow-900/20 p-4">
          <Text className="text-sm text-foreground mb-2 font-semibold">Expected Values:</Text>
          <Text className="text-xs text-muted-foreground mb-1">
            Domain: md8kiz-xp.myshopify.com
          </Text>
          <Text className="text-xs text-muted-foreground">
            Token: Starts with 'shpat_' or long alphanumeric string
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
