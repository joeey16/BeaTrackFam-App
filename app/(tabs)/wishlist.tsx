import * as React from "react";
import { View, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useWishlist } from "~/lib/contexts/WishlistContext";
import { useProducts } from "~/lib/shopify/hooks";
import { useTheme } from "~/theming/ThemeProvider";
import { router } from "expo-router";
import LucideIcon from "~/lib/icons/LucideIcon";
import type { ShopifyProduct } from "~/lib/shopify/types";

function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

function WishlistProductCard({ product }: { product: ShopifyProduct }) {
  const { theme } = useTheme();
  const { removeFromWishlist } = useWishlist();
  const firstImage = product.images.edges[0]?.node;
  const defaultVariant = product.variants.edges[0]?.node;
  const price = defaultVariant?.price ?? product.priceRange.minVariantPrice;
  const compareAtPrice = defaultVariant?.compareAtPrice ?? null;
  const isOnSale = !!compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price.amount);

  return (
    <Pressable
      onPress={() => router.push(`/product/${product.handle}`)}
      className="mb-4 flex-row rounded-2xl bg-card p-3"
    >
      {firstImage && (
        <View className="relative">
          <Image source={{ uri: firstImage.url }} className="h-24 w-24 rounded-xl" />
          {isOnSale && (
            <View className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-1">
              <Text className="text-[10px] font-semibold text-destructive-foreground">On Sale</Text>
            </View>
          )}
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
          {product.title}
        </Text>
        <View className="mt-1 flex-row items-baseline gap-2">
          <Text className={`text-lg font-bold ${isOnSale ? "text-destructive" : "text-primary"}`}>
            {formatPrice(price.amount, price.currencyCode)}
          </Text>
          {isOnSale && compareAtPrice && (
            <Text className="text-xs text-muted-foreground line-through">
              {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
            </Text>
          )}
        </View>
        {isOnSale && (
          <View className="mt-1 rounded-full bg-destructive px-2 py-0.5 self-start">
            <Text className="text-[10px] font-semibold text-destructive-foreground">On Sale</Text>
          </View>
        )}
      </View>
      <Pressable
        onPress={() => removeFromWishlist(product.id)}
        className="h-10 w-10 items-center justify-center"
      >
        <LucideIcon name="X" size={20} color={theme.colors.mutedForeground} />
      </Pressable>
    </Pressable>
  );
}

export default function WishlistScreen() {
  const { theme } = useTheme();
  const { wishlist } = useWishlist();
  const { data: productsData, isLoading } = useProducts(250);

  const wishlistProducts = React.useMemo(() => {
    if (!productsData?.products) return [];
    return productsData.products.filter((product) => wishlist.includes(product.id));
  }, [productsData, wishlist]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const isEmpty = wishlistProducts.length === 0;

  return (
    <View className="flex-1 bg-background">
      {isEmpty ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-32 w-32 items-center justify-center rounded-full bg-muted mb-6">
            <LucideIcon name="Heart" size={64} color={theme.colors.mutedForeground} />
          </View>
          <Text className="text-h3 mb-2 text-center font-semibold text-foreground">
            Your Wishlist is Empty
          </Text>
          <Text className="mb-6 text-center text-muted-foreground">
            Save your favorite items to your wishlist
          </Text>
          <Button onPress={() => router.push("/(tabs)")}>
            <Text>Start Shopping</Text>
          </Button>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <Text className="mb-4 text-sm text-muted-foreground">
            {wishlistProducts.length} {wishlistProducts.length === 1 ? "item" : "items"} saved
          </Text>
          {wishlistProducts.map((product) => (
            <WishlistProductCard key={product.id} product={product} />
          ))}
          <View className="h-8" />
        </ScrollView>
      )}
    </View>
  );
}
