import * as React from "react";
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useProducts, useCollections, useSearchProducts } from "~/lib/shopify/hooks";
import LucideIcon from "~/lib/icons/LucideIcon";
import { useTheme } from "~/theming/ThemeProvider";
import { useWishlist } from "~/lib/contexts/WishlistContext";
import { router } from "expo-router";
import type { ShopifyProduct, ShopifyCollection } from "~/lib/shopify/types";

function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

function CollectionCard({ collection }: { collection: ShopifyCollection }) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => router.push(`/collection/${collection.handle}`)}
      className="mr-4 w-40 overflow-hidden rounded-2xl bg-card"
    >
      {collection.image && (
        <Image source={{ uri: collection.image.url }} className="h-32 w-full" resizeMode="cover" />
      )}
      <View className="p-3">
        <Text className="text-sm font-semibold text-foreground">{collection.title}</Text>
      </View>
    </Pressable>
  );
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
              name={inWishlist ? "Heart" : "Heart"}
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

export default function ShopScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  const {
    data: productsData,
    isLoading: loadingProducts,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts(250);
  const {
    data: collections,
    isLoading: loadingCollections,
    error: collectionsError,
    refetch: refetchCollections,
  } = useCollections(10);
  const { data: searchResults, isLoading: loadingSearch } = useSearchProducts(debouncedSearch, 250);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const products = debouncedSearch ? searchResults : productsData?.products;
  const isLoading = loadingProducts || loadingCollections;
  const hasError = productsError || collectionsError;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        {/* Search Bar */}
        <View className="px-4 pt-3 pb-3 border-b border-border">
          <View className="flex-row items-center rounded-xl bg-card px-4 py-3 border border-border">
            <LucideIcon name="Search" size={20} color={theme.colors.mutedForeground} />
            <TextInput
              placeholder="Search products..."
              placeholderTextColor={theme.colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="ml-3 flex-1 text-base text-foreground"
              style={{ fontFamily: theme.typography.body?.fontFamily }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <LucideIcon name="X" size={20} color={theme.colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text className="mt-4 text-sm text-muted-foreground">Loading products...</Text>
            </View>
          ) : hasError ? (
            <View className="flex-1 items-center justify-center px-6 py-20">
              <View className="h-24 w-24 items-center justify-center rounded-full bg-destructive/10 mb-4">
                <LucideIcon name="CircleAlert" size={48} color={theme.colors.destructive} />
              </View>
              <Text className="text-h3 mb-2 text-center font-semibold text-foreground">
                Unable to Load Products
              </Text>
              <Text className="text-center text-muted-foreground mb-6">
                Please check that your Shopify credentials are configured correctly in the
                environment variables.
              </Text>
              <Text className="text-xs text-center text-muted-foreground mb-2">
                Error: {productsError?.message || collectionsError?.message || "Unknown error"}
              </Text>
              <Button
                className="mt-4 w-full"
                onPress={() => {
                  refetchProducts();
                  refetchCollections();
                }}
              >
                <Text>Retry</Text>
              </Button>
            </View>
          ) : (
            <>
              {/* Collections */}
              {!debouncedSearch && collections && collections.length > 0 && (
                <View className="mb-6">
                  <View className="px-4 mb-3 flex-row items-center justify-between">
                    <Text className="text-lg font-semibold text-foreground">Collections</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="pl-4"
                    contentContainerClassName="pr-4"
                  >
                    {collections.map((collection) => (
                      <CollectionCard key={collection.id} collection={collection} />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Products Grid */}
              <View className="px-4 pb-6">
                <Text className="text-lg font-semibold text-foreground mb-3">
                  {debouncedSearch ? "Search Results" : "All Products"}
                </Text>
                {products && products.length > 0 ? (
                  <View className="flex-row flex-wrap justify-between">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </View>
                ) : (
                  <View className="py-12">
                    <Text className="text-center text-muted-foreground">
                      {debouncedSearch ? "No products found" : "No products available"}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
