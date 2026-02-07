import * as React from "react";
import { View, ScrollView, Pressable, Image, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { useProducts, useSearchProducts } from "~/lib/shopify/hooks";
import { useTheme } from "~/theming/ThemeProvider";
import { useWishlist } from "~/lib/contexts/WishlistContext";
import { router, Stack } from "expo-router";
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
      className="w-[48%] mb-4 overflow-hidden rounded-2xl bg-card shadow-sm"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {firstImage && (
        <View className="relative">
          <Image
            source={{ uri: firstImage.url }}
            className="h-48 w-full bg-muted"
            resizeMode="cover"
          />
          {isOnSale && (
            <View className="absolute left-2 top-2 rounded-full bg-destructive px-2.5 py-1">
              <Text className="text-xs font-semibold text-destructive-foreground">Sale</Text>
            </View>
          )}
          <Pressable
            onPress={handleWishlistToggle}
            className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <LucideIcon
              name="Heart"
              size={18}
              color={inWishlist ? "#FF0000" : theme.colors.foreground}
              fill={inWishlist ? "#FF0000" : "none"}
            />
          </Pressable>
        </View>
      )}
      <View className="p-3">
        <Text className="text-sm font-medium text-foreground" numberOfLines={2}>
          {product.title}
        </Text>
        <View className="mt-1.5 flex-row items-baseline gap-2">
          <Text
            className={`text-base font-bold ${isOnSale ? "text-destructive" : "text-foreground"}`}
          >
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

export default function AllProductsScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"default" | "price-low" | "price-high" | "name">(
    "default",
  );

  const { data: productsData, isLoading: loadingProducts } = useProducts(250);
  const { data: searchResults, isLoading: loadingSearch } = useSearchProducts(debouncedSearch, 250);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const rawProducts = debouncedSearch ? searchResults : productsData?.products;

  // Sort products
  const products = React.useMemo(() => {
    if (!rawProducts) return rawProducts;

    const sorted = [...rawProducts];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => {
          const priceA = parseFloat(a.priceRange.minVariantPrice.amount);
          const priceB = parseFloat(b.priceRange.minVariantPrice.amount);
          return priceA - priceB;
        });
      case "price-high":
        return sorted.sort((a, b) => {
          const priceA = parseFloat(a.priceRange.minVariantPrice.amount);
          const priceB = parseFloat(b.priceRange.minVariantPrice.amount);
          return priceB - priceA;
        });
      case "name":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  }, [rawProducts, sortBy]);

  const isLoading = loadingProducts || loadingSearch;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <Stack.Screen options={{ title: "All Products", headerBackTitle: "Back" }} />
      <View className="flex-1">
        {/* Search Bar */}
        <View className="px-4 pt-4 pb-3 border-b border-border">
          <View className="flex-row items-center rounded-xl bg-muted px-4 py-3 mb-3">
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

          {/* Sort Options */}
          <View>
            <Text className="text-xs font-semibold text-muted-foreground mb-2">SORT BY</Text>
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => setSortBy("default")}
                className={`flex-1 px-4 py-2.5 rounded-lg ${
                  sortBy === "default" ? "bg-primary" : "bg-card border border-border"
                }`}
                style={{ minWidth: "47%" }}
              >
                <Text
                  className={`text-sm font-medium text-center ${
                    sortBy === "default" ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  Default
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSortBy("price-low")}
                className={`flex-1 px-4 py-2.5 rounded-lg ${
                  sortBy === "price-low" ? "bg-primary" : "bg-card border border-border"
                }`}
                style={{ minWidth: "47%" }}
              >
                <Text
                  className={`text-sm font-medium text-center ${
                    sortBy === "price-low" ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  Price: Low-High
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSortBy("price-high")}
                className={`flex-1 px-4 py-2.5 rounded-lg ${
                  sortBy === "price-high" ? "bg-primary" : "bg-card border border-border"
                }`}
                style={{ minWidth: "47%" }}
              >
                <Text
                  className={`text-sm font-medium text-center ${
                    sortBy === "price-high" ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  Price: High-Low
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSortBy("name")}
                className={`flex-1 px-4 py-2.5 rounded-lg ${
                  sortBy === "name" ? "bg-primary" : "bg-card border border-border"
                }`}
                style={{ minWidth: "47%" }}
              >
                <Text
                  className={`text-sm font-medium text-center ${
                    sortBy === "name" ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  A-Z
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text className="mt-4 text-sm text-muted-foreground">Loading products...</Text>
          </View>
        ) : !products || products.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-muted mb-4">
              <LucideIcon name="Package" size={48} color={theme.colors.mutedForeground} />
            </View>
            <Text className="text-h3 mb-2 text-center font-semibold text-foreground">
              {debouncedSearch ? "No products found" : "No Products Available"}
            </Text>
            <Text className="text-center text-muted-foreground">
              {debouncedSearch ? "Try a different search" : "Check back later for new products"}
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
            <Text className="text-sm text-muted-foreground mb-4">
              {products.length} {products.length === 1 ? "Product" : "Products"}
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </View>
            <View className="h-8" />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
