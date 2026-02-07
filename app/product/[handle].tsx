import * as React from "react";
import {
  View,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useLocalSearchParams, router } from "expo-router";
import { useProduct, useAddToCart, useProducts } from "~/lib/shopify/hooks";
import { useCartContext } from "~/lib/contexts/CartContext";
import { useWishlist } from "~/lib/contexts/WishlistContext";
import { usePreferences } from "~/lib/contexts/PreferencesContext";
import { useTheme } from "~/theming/ThemeProvider";
import LucideIcon from "~/lib/icons/LucideIcon";
import { StarRating } from "~/components/StarRating";
import type { ShopifyProductVariant } from "~/lib/shopify/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export default function ProductDetailScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { theme } = useTheme();
  const { cartId, initializeCart } = useCartContext();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { preferences } = usePreferences();
  const { data: product, isLoading } = useProduct(handle);
  const { data: productsData } = useProducts(20);
  const addToCart = useAddToCart();

  const [selectedVariant, setSelectedVariant] = React.useState<ShopifyProductVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = React.useState<Record<string, string>>({});
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);

  // Get related products (same product type, excluding current product)
  const relatedProducts = React.useMemo(() => {
    if (!product || !productsData?.products) return [];
    return productsData.products
      .filter(
        (p) => p.id !== product.id && p.productType === product.productType && p.availableForSale,
      )
      .slice(0, 6);
  }, [product, productsData]);

  // Find variant based on selected options
  const findVariantByOptions = React.useCallback(
    (options: Record<string, string>) => {
      if (!product) return null;

      return product.variants.edges.find(({ node: variant }) => {
        return variant.selectedOptions.every((opt) => options[opt.name] === opt.value);
      })?.node;
    },
    [product],
  );

  // Set initial variant and options with user preferences
  React.useEffect(() => {
    if (product && product.variants.edges.length > 0) {
      const firstVariant = product.variants.edges[0].node;

      const initialOptions: Record<string, string> = {};
      firstVariant.selectedOptions.forEach((opt) => {
        // Try to match user preferences for Size and Device Model
        if (opt.name.toLowerCase() === "size" && preferences.defaultSize) {
          // Check if the preference value exists in available options
          const availableValues = product.options.find((o) => o.name === opt.name)?.values || [];
          if (availableValues.includes(preferences.defaultSize)) {
            initialOptions[opt.name] = preferences.defaultSize;
          } else {
            initialOptions[opt.name] = opt.value;
          }
        } else if (
          (opt.name.toLowerCase().includes("device") || opt.name.toLowerCase().includes("model")) &&
          preferences.defaultDeviceModel
        ) {
          // Check if the preference value exists in available options
          const availableValues = product.options.find((o) => o.name === opt.name)?.values || [];
          if (availableValues.includes(preferences.defaultDeviceModel)) {
            initialOptions[opt.name] = preferences.defaultDeviceModel;
          } else {
            initialOptions[opt.name] = opt.value;
          }
        } else {
          initialOptions[opt.name] = opt.value;
        }
      });

      setSelectedOptions(initialOptions);

      // Find matching variant or fallback to first variant
      const matchingVariant = findVariantByOptions(initialOptions) || firstVariant;
      setSelectedVariant(matchingVariant);
    }
  }, [product, preferences, findVariantByOptions]);

  const handleOptionChange = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);

    const variant = findVariantByOptions(newOptions);
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      Alert.alert("Error", "Please select a variant");
      return;
    }

    if (!selectedVariant.availableForSale) {
      Alert.alert("Error", "This item is currently unavailable");
      return;
    }

    try {
      let activeCartId = cartId;

      // Create cart if it doesn't exist
      if (!activeCartId) {
        console.log("No cart found, creating new cart...");
        activeCartId = await initializeCart();
        console.log("Cart created:", activeCartId);
      }

      if (!activeCartId) {
        throw new Error("Failed to initialize cart");
      }

      console.log("Adding item to cart:", { cartId: activeCartId, variantId: selectedVariant.id });

      await addToCart.mutateAsync({
        cartId: activeCartId,
        merchandiseId: selectedVariant.id,
        quantity: quantity,
      });

      console.log("Item added successfully");

      Alert.alert("Success", `Added ${quantity} ${quantity === 1 ? "item" : "items"} to cart`, [
        { text: "Continue Shopping", style: "cancel" },
        { text: "View Cart", onPress: () => router.push("/(tabs)/cart") },
      ]);
    } catch (error) {
      console.error("Add to cart failed:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to add to cart. Please try again.",
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-h3 mb-2 text-center text-foreground">Product not found</Text>
          <Button onPress={() => router.back()}>
            <Text>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const images = product.images.edges.map((edge) => edge.node);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <View className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Image Gallery */}
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIndex(index);
              }}
            >
              {images.map((image, index) => (
                <Image
                  key={image.id}
                  source={{ uri: image.url }}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* Image Indicator */}
            {images.length > 1 && (
              <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
                {images.map((_, index) => (
                  <View
                    key={index}
                    className={`mx-1 h-2 w-2 rounded-full ${
                      index === activeImageIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </View>
            )}
          </View>

          <View className="px-4 py-5">
            {/* Title */}
            <Text className="text-2xl font-bold text-foreground mb-2">{product.title}</Text>

            {/* Rating - TODO: Fetch real reviews from review app integration */}
            <View className="mb-5 pb-5 border-b border-border">
              <StarRating rating={0} reviewCount={0} size={14} />
            </View>

            {/* Variant Options */}
            {product.options.map((option) => {
              if (option.values.length <= 1) return null;

              return (
                <View key={option.id} className="mb-5">
                  <Text className="text-base font-semibold text-foreground mb-3">
                    {option.name}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {option.values.map((value) => {
                      const isSelected = selectedOptions[option.name] === value;
                      return (
                        <Pressable
                          key={value}
                          onPress={() => handleOptionChange(option.name, value)}
                          className={`rounded-lg px-5 py-3 ${
                            isSelected ? "bg-primary" : "bg-card border border-border"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              isSelected ? "text-primary-foreground" : "text-foreground"
                            }`}
                          >
                            {value}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* Quantity Selector */}
            {selectedVariant?.availableForSale && (
              <View className="mb-5">
                <Text className="text-base font-semibold text-foreground mb-3">Quantity</Text>
                <View className="flex-row items-center">
                  <Pressable
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-11 w-11 items-center justify-center rounded-lg border border-border bg-card"
                  >
                    <LucideIcon
                      name="Minus"
                      size={18}
                      color={quantity <= 1 ? theme.colors.mutedForeground : theme.colors.foreground}
                    />
                  </Pressable>

                  <View className="mx-5 min-w-16 items-center">
                    <Text className="text-xl font-semibold text-foreground">{quantity}</Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      const maxQty = selectedVariant.quantityAvailable || 99;
                      setQuantity(Math.min(maxQty, quantity + 1));
                    }}
                    className="h-11 w-11 items-center justify-center rounded-lg border border-border bg-card"
                  >
                    <LucideIcon name="Plus" size={18} color={theme.colors.foreground} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Description */}
            <View className="mb-5 pb-5 border-b border-border">
              <Text className="mb-3 text-base font-semibold text-foreground">Product Details</Text>
              <Text className="text-sm leading-6 text-muted-foreground">
                {product.description || "No description available for this product."}
              </Text>
            </View>

            {/* Stock Status */}
            {selectedVariant && (
              <View className="mb-5 flex-row items-center">
                <View
                  className={`h-2 w-2 rounded-full ${
                    selectedVariant.availableForSale ? "bg-success" : "bg-destructive"
                  }`}
                />
                <Text
                  className={`ml-2 text-sm font-medium ${
                    selectedVariant.availableForSale ? "text-success" : "text-destructive"
                  }`}
                >
                  {selectedVariant.availableForSale ? "In Stock" : "Out of Stock"}
                </Text>
              </View>
            )}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <View className="mb-6">
                <Text className="mb-4 text-lg font-semibold text-foreground">
                  You May Also Like
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                >
                  {relatedProducts.map((relatedProduct) => {
                    const defaultVariant = relatedProduct.variants.edges[0]?.node;
                    const price =
                      defaultVariant?.price ?? relatedProduct.priceRange.minVariantPrice;
                    const compareAtPrice = defaultVariant?.compareAtPrice ?? null;
                    const isOnSale =
                      !!compareAtPrice &&
                      parseFloat(compareAtPrice.amount) > parseFloat(price.amount);
                    const image = relatedProduct.images.edges[0]?.node;

                    return (
                      <Pressable
                        key={relatedProduct.id}
                        onPress={() => router.push(`/product/${relatedProduct.handle}`)}
                        className="mr-3 w-40"
                      >
                        <View className="mb-2 overflow-hidden rounded-xl bg-muted">
                          {image ? (
                            <Image
                              source={{ uri: image.url }}
                              style={{ width: 160, height: 160 }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              className="items-center justify-center"
                              style={{ width: 160, height: 160 }}
                            >
                              <LucideIcon
                                name="ImageOff"
                                size={40}
                                color={theme.colors.mutedForeground}
                              />
                            </View>
                          )}
                        </View>

                        <Text
                          className="mb-1 text-sm font-medium text-foreground"
                          numberOfLines={2}
                        >
                          {relatedProduct.title}
                        </Text>

                        <View className="flex-row items-baseline gap-2">
                          <Text
                            className={`text-sm font-semibold ${
                              isOnSale ? "text-destructive" : "text-primary"
                            }`}
                          >
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
                            <Text className="text-[10px] font-semibold text-destructive-foreground">
                              On Sale
                            </Text>
                          </View>
                        )}

                        {!relatedProduct.availableForSale && (
                          <Text className="text-xs text-destructive">Out of Stock</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Section - Price & Add to Cart */}
        <View className="border-t border-border bg-background px-4 py-4">
          {selectedVariant && (
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-xs text-muted-foreground mb-1">Total Price</Text>
                {(() => {
                  const compareAtPrice = selectedVariant.compareAtPrice;
                  const isOnSale =
                    compareAtPrice &&
                    parseFloat(compareAtPrice.amount) > parseFloat(selectedVariant.price.amount);

                  return (
                    <View className="flex-row items-baseline gap-2">
                      <Text className="text-2xl font-bold text-foreground">
                        {formatPrice(
                          selectedVariant.price.amount,
                          selectedVariant.price.currencyCode,
                        )}
                      </Text>
                      {isOnSale && compareAtPrice && (
                        <Text className="text-sm text-muted-foreground line-through">
                          {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
                        </Text>
                      )}
                    </View>
                  );
                })()}
              </View>
              <Pressable
                onPress={() => toggleWishlist(product.id)}
                className="h-12 w-12 items-center justify-center rounded-full border-2 border-border"
              >
                <LucideIcon
                  name="Heart"
                  size={22}
                  color={isInWishlist(product.id) ? "#FF0000" : theme.colors.foreground}
                  fill={isInWishlist(product.id) ? "#FF0000" : "none"}
                />
              </Pressable>
            </View>
          )}
          <Button
            onPress={handleAddToCart}
            disabled={!selectedVariant?.availableForSale || addToCart.isPending}
            size="lg"
            className="w-full"
          >
            {addToCart.isPending ? (
              <ActivityIndicator color={theme.colors.primaryForeground} />
            ) : (
              <Text>Add to Cart</Text>
            )}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
