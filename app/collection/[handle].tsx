import * as React from "react";
import { View, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useLocalSearchParams, router } from "expo-router";
import { useCollection } from "~/lib/shopify/hooks";
import * as ShopifyAPI from "~/lib/shopify/client";
import { useTheme } from "~/theming/ThemeProvider";
import { useWishlist } from "~/lib/contexts/WishlistContext";
import LucideIcon from "~/lib/icons/LucideIcon";
import type { ShopifyProduct } from "~/lib/shopify/types";
function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}
function ProductCard({ product }: { product: ShopifyProduct }) {
  const { theme } = useTheme();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const firstImage = product.images.edges[0]?.node;
  const defaultVariant = product.variants.edges[0]?.node;
  const price = defaultVariant?.price ?? product.priceRange.minVariantPrice;
  const compareAtPrice = defaultVariant?.compareAtPrice ?? null;
  const isOnSale = !!compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price.amount);
  const inWishlist = isInWishlist(product.id);
  const handleWishlistToggle = (e: any) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };
  return (
    <Pressable
      onPress={() => router.push(`/product/${product.handle}`)}
      className="w-[48%] mb-4 overflow-hidden rounded-2xl bg-card"
    >
      {firstImage && (
        <View className="relative">
          <Image source={{ uri: firstImage.url }} className="h-48 w-full" resizeMode="cover" />
          {isOnSale && (
            <View className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-1">
              <Text className="text-xs font-semibold text-destructive-foreground">On Sale</Text>
            </View>
          )}
          <Pressable
            onPress={handleWishlistToggle}
            className="absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-full bg-background/90"
          >
            <LucideIcon
              name="Heart"
              size={20}
              color={inWishlist ? "#FF0000" : theme.colors.foreground}
              fill={inWishlist ? "#FF0000" : "none"}
            />
          </Pressable>
        </View>
      )}
      <View className="p-3">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
          {product.title}
        </Text>
        <View className="mt-1 flex-row items-baseline gap-2">
          <Text className={`text-base font-bold ${isOnSale ? "text-destructive" : "text-primary"}`}>
            {formatPrice(price.amount, price.currencyCode)}
          </Text>
          {isOnSale && compareAtPrice && (
            <Text className="text-xs text-muted-foreground line-through">
              {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
export default function CollectionDetailScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { theme } = useTheme();
  const { data: collection, isLoading } = useCollection(handle);
  const [products, setProducts] = React.useState<ShopifyProduct[]>([]);
  const [totalCount, setTotalCount] = React.useState<number | null>(null);
  const [pageInfo, setPageInfo] = React.useState<{
    hasNextPage: boolean;
    endCursor: string | null;
  } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  React.useEffect(() => {
    if (!collection) {
      return;
    }
    const nextProducts = collection.products.edges.map((edge) => edge.node);
    setProducts(nextProducts);
    setPageInfo(collection.products.pageInfo ?? null);
  }, [collection]);
  React.useEffect(() => {
    if (!handle) {
      return;
    }
    let isActive = true;
    ShopifyAPI.getCollectionProductCount(handle)
      .then((count) => {
        if (isActive) {
          setTotalCount(count);
        }
      })
      .catch(() => {
        if (isActive) {
          setTotalCount(null);
        }
      });
    return () => {
      isActive = false;
    };
  }, [handle]);
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  if (!collection) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-h3 mb-2 text-center text-foreground">Collection not found</Text>
          <Button onPress={() => router.back()}>
            <Text>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }
  const canLoadMore = !!pageInfo?.hasNextPage;
  const handleLoadMore = async () => {
    if (!handle || !pageInfo?.hasNextPage || isLoadingMore) {
      return;
    }
    setIsLoadingMore(true);
    try {
      const nextPage = await ShopifyAPI.getCollectionByHandle(handle, 250, pageInfo.endCursor);
      if (!nextPage) {
        return;
      }
      const nextProducts = nextPage.products.edges.map((edge) => edge.node);
      setProducts((prev) => prev.concat(nextProducts));
      setPageInfo(nextPage.products.pageInfo ?? { hasNextPage: false, endCursor: null });
    } finally {
      setIsLoadingMore(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Collection Header */}
        {collection.image && (
          <Image
            source={{ uri: collection.image.url }}
            className="h-48 w-full"
            resizeMode="cover"
          />
        )}
        <View className="px-4 py-6">
          <Text className="text-h2 mb-2 font-bold text-foreground">{collection.title}</Text>
          {collection.description && (
            <Text className="mb-6 text-base text-muted-foreground">{collection.description}</Text>
          )}
          {/* Products Count */}
          <Text className="mb-4 text-sm text-muted-foreground">
            {(totalCount ?? products.length).toLocaleString()}{" "}
            {(totalCount ?? products.length) === 1 ? "product" : "products"}
          </Text>
          {/* Products Grid */}
          {products.length > 0 ? (
            <>
              <View className="flex-row flex-wrap justify-between">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </View>
              {canLoadMore && (
                <View className="mt-6">
                  <Button onPress={handleLoadMore} disabled={isLoadingMore} className="w-full">
                    <Text>{isLoadingMore ? "Loading products..." : "Load more products"}</Text>
                  </Button>
                </View>
              )}
            </>
          ) : (
            <View className="py-12">
              <Text className="text-center text-muted-foreground">
                No products in this collection
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
