import * as React from "react";
import { View, ScrollView, Pressable, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { useCollections } from "~/lib/shopify/hooks";
import { useTheme } from "~/theming/ThemeProvider";
import { router, Stack } from "expo-router";
import LucideIcon from "~/lib/icons/LucideIcon";
import type { ShopifyCollection } from "~/lib/shopify/types";

function CollectionCard({ collection }: { collection: ShopifyCollection }) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => router.push(`/collection/${collection.handle}`)}
      className="w-[48%] mb-4 overflow-hidden rounded-2xl bg-card"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {collection.image ? (
        <Image source={{ uri: collection.image.url }} className="h-40 w-full" resizeMode="cover" />
      ) : (
        <View className="h-40 w-full items-center justify-center bg-muted">
          <LucideIcon name="Package" size={48} color={theme.colors.mutedForeground} />
        </View>
      )}
      <View className="p-3">
        <Text className="text-sm font-bold text-foreground mb-1" numberOfLines={1}>
          {collection.title}
        </Text>
        {collection.description && (
          <Text className="text-xs text-muted-foreground" numberOfLines={2}>
            {collection.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function AllCollectionsScreen() {
  const { theme } = useTheme();
  const { data: collections, isLoading } = useCollections(50);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <Stack.Screen options={{ title: "All Collections", headerBackTitle: "Back" }} />
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text className="mt-4 text-sm text-muted-foreground">Loading categories...</Text>
          </View>
        ) : !collections || collections.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-muted mb-4">
              <LucideIcon name="Package" size={48} color={theme.colors.mutedForeground} />
            </View>
            <Text className="text-h3 mb-2 text-center font-semibold text-foreground">
              No Collections Found
            </Text>
            <Text className="text-center text-muted-foreground">
              Check back later for new collections
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
            <Text className="text-sm text-muted-foreground mb-4">
              {collections.length} {collections.length === 1 ? "Collection" : "Collections"}
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </View>
            <View className="h-8" />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
