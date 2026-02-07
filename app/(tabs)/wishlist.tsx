import * as React from "react";
import { View, ScrollView, Image, Pressable, ActivityIndicator, Alert } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useWishlist } from "~/lib/contexts/WishlistContext";
import { useProducts, useAddToCart } from "~/lib/shopify/hooks";
import { useCartContext } from "~/lib/contexts/CartContext";
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

function WishlistProductCard({
  product,
  cartId,
  initializeCart,
}: {
  product: ShopifyProduct;
  cartId: string | null;
  initializeCart: () => Promise<string>;
}) {
  const { theme } = useTheme();
  const { removeFromWishlist } = useWishlist();
  const addToCart = useAddToCart();
  const firstImage = product.images.edges[0]?.node;
  const defaultVariant = product.variants.edges[0]?.node;
  const price = defaultVariant?.price ?? product.priceRange.minVariantPrice;
  const compareAtPrice = defaultVariant?.compareAtPrice ?? null;
  const isOnSale = !!compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price.amount);

  const handleAddToCart = async (e: any) => {
    e.stopPropagation();

    if (!defaultVariant) {
      Alert.alert("Error", "No variant available");
      return;
    }

    try {
      let activeCartId = cartId;
      if (!activeCartId) {
        activeCartId = await initializeCart();
      }

      if (!activeCartId) {
        throw new Error("Failed to initialize cart");
      }

      await addToCart.mutateAsync({
        cartId: activeCartId,
        merchandiseId: defaultVariant.id,
        quantity: 1,
      });

      Alert.alert("Added to Cart", `${product.title} has been added to your cart`, [
        { text: "Continue Shopping", style: "cancel" },
        { text: "View Cart", onPress: () => router.push("/(tabs)/cart") },
      ]);
    } catch (error) {
      console.error("Add to cart failed:", error);
      Alert.alert("Error", "Failed to add to cart. Please try again.");
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/product/${product.handle}`)}
      className="mb-3 rounded-2xl bg-card border border-border p-3"
    >
      <View className="flex-row">
        {firstImage && (
          <View className="relative">
            <Image source={{ uri: firstImage.url }} className="h-24 w-24 rounded-xl" />
            {isOnSale && (
              <View className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-1">
                <Text className="text-[10px] font-semibold text-destructive-foreground">Sale</Text>
              </View>
            )}
          </View>
        )}
        <View className="ml-3 flex-1">
          <View className="flex-row items-start justify-between mb-1">
            <Text className="text-base font-semibold text-foreground flex-1 mr-2" numberOfLines={2}>
              {product.title}
            </Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                removeFromWishlist(product.id);
              }}
              className="h-8 w-8 items-center justify-center"
            >
              <LucideIcon name="X" size={18} color={theme.colors.mutedForeground} />
            </Pressable>
          </View>
          <View className="mt-1 flex-row items-baseline gap-2">
            <Text
              className={`text-lg font-bold ${isOnSale ? "text-destructive" : "text-foreground"}`}
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
      </View>

      {/* Add to Cart Button - Small Circular */}
      <Pressable
        onPress={handleAddToCart}
        disabled={!defaultVariant?.availableForSale || addToCart.isPending}
        className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-primary items-center justify-center shadow-md"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        {addToCart.isPending ? (
          <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
        ) : (
          <LucideIcon name="ShoppingCart" size={16} color={theme.colors.primaryForeground} />
        )}
      </Pressable>
    </Pressable>
  );
}

export default function WishlistScreen() {
  const { theme } = useTheme();
  const { wishlist } = useWishlist();
  const { cartId, initializeCart } = useCartContext();
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
            <WishlistProductCard
              key={product.id}
              product={product}
              cartId={cartId}
              initializeCart={initializeCart}
            />
          ))}
          <View className="h-8" />
        </ScrollView>
      )}
    </View>
  );
}
