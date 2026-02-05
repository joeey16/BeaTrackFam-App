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

          <View className="px-4 py-6">
            {/* Title and Price */}
            <View className="mb-2 flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-h2 font-bold text-foreground">{product.title}</Text>
              </View>
              <Pressable
                onPress={() => toggleWishlist(product.id)}
                className="ml-3 h-12 w-12 items-center justify-center rounded-full bg-muted"
              >
                <LucideIcon
                  name="Heart"
                  size={24}
                  color={isInWishlist(product.id) ? "#FF0000" : theme.colors.foreground}
                  fill={isInWishlist(product.id) ? "#FF0000" : "none"}
                />
              </Pressable>
            </View>
            <Text className="text-sm text-muted-foreground mb-4">{product.vendor}</Text>

            {selectedVariant && (
              <View className="mb-6">
                {(() => {
                  const compareAtPrice = selectedVariant.compareAtPrice;
                  const isOnSale =
                    compareAtPrice &&
                    parseFloat(compareAtPrice.amount) > parseFloat(selectedVariant.price.amount);

                  return (
                    <>
                      <View className="flex-row items-center gap-3">
                        <Text
                          className={`text-2xl font-bold ${
                            isOnSale ? "text-destructive" : "text-primary"
                          }`}
                        >
                          {formatPrice(
                            selectedVariant.price.amount,
                            selectedVariant.price.currencyCode,
                          )}
                        </Text>
                        {isOnSale && (
                          <View className="rounded-full bg-destructive px-2 py-1">
                            <Text className="text-xs font-semibold text-destructive-foreground">
                              On Sale
                            </Text>
                          </View>
                        )}
                      </View>
                      {isOnSale && compareAtPrice && (
                        <Text className="text-base text-muted-foreground line-through">
                          {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
                        </Text>
                      )}
                    </>
                  );
                })()}
              </View>
            )}

            {/* Variant Options */}
            {product.options.map((option) => {
              if (option.values.length <= 1) return null;

              // Check if this option matches user preference
              const isPreferenceOption =
                option.name.toLowerCase() === "size" ||
                option.name.toLowerCase().includes("device") ||
                option.name.toLowerCase().includes("model");

              const preferenceValue =
                option.name.toLowerCase() === "size"
                  ? preferences.defaultSize
                  : (option.name.toLowerCase().includes("device") ||
                        option.name.toLowerCase().includes("model")) &&
                      preferences.defaultDeviceModel
                    ? preferences.defaultDeviceModel
                    : null;

              return (
                <View key={option.id} className="mb-6">
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-foreground">
                      {option.name}: {selectedOptions[option.name]}
                    </Text>
                    {isPreferenceOption && preferenceValue && (
                      <View className="flex-row items-center rounded-full bg-primary/10 px-3 py-1">
                        <LucideIcon name="User" size={12} color={theme.colors.primary} />
                        <Text className="ml-1 text-xs font-medium text-primary">
                          Your Preference
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row flex-wrap">
                    {option.values.map((value) => {
                      const isSelected = selectedOptions[option.name] === value;
                      const isPreferred = preferenceValue === value;
                      return (
                        <Pressable
                          key={value}
                          onPress={() => handleOptionChange(option.name, value)}
                          className={`mr-3 mb-3 rounded-xl border-2 px-6 py-3 ${
                            isSelected ? "border-primary bg-primary/10" : "border-border bg-card"
                          }`}
                        >
                          <View className="flex-row items-center">
                            <Text
                              className={`text-sm font-medium ${
                                isSelected ? "text-primary" : "text-foreground"
                              }`}
                            >
                              {value}
                            </Text>
                            {isPreferred && !isSelected && (
                              <LucideIcon
                                name="Star"
                                size={12}
                                color={theme.colors.primary}
                                fill={theme.colors.primary}
                                style={{ marginLeft: 4 }}
                              />
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* Availability */}
            {selectedVariant && (
              <View className="mb-6 flex-row items-center">
                <LucideIcon
                  name={selectedVariant.availableForSale ? "CircleCheck" : "CircleX"}
                  size={20}
                  color={
                    selectedVariant.availableForSale
                      ? theme.colors.primary
                      : theme.colors.destructive
                  }
                />
                <Text
                  className={`ml-2 text-sm ${
                    selectedVariant.availableForSale ? "text-primary" : "text-destructive"
                  }`}
                >
                  {selectedVariant.availableForSale
                    ? `In Stock${selectedVariant.quantityAvailable > 0 ? ` (${selectedVariant.quantityAvailable} available)` : ""}`
                    : "Out of Stock"}
                </Text>
              </View>
            )}

            {/* Quantity Selector */}
            {selectedVariant?.availableForSale && (
              <View className="mb-6">
                <Text className="mb-3 text-base font-semibold text-foreground">Quantity</Text>
                <View className="flex-row items-center">
                  <Pressable
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className={`h-12 w-12 items-center justify-center rounded-xl border-2 ${
                      quantity <= 1 ? "border-muted bg-muted" : "border-primary bg-primary/10"
                    }`}
                  >
                    <LucideIcon
                      name="Minus"
                      size={20}
                      color={quantity <= 1 ? theme.colors.mutedForeground : theme.colors.primary}
                    />
                  </Pressable>

                  <View className="mx-4 min-w-16 items-center">
                    <Text className="text-2xl font-bold text-foreground">{quantity}</Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      const maxQty = selectedVariant.quantityAvailable || 99;
                      setQuantity(Math.min(maxQty, quantity + 1));
                    }}
                    disabled={
                      selectedVariant.quantityAvailable > 0 &&
                      quantity >= selectedVariant.quantityAvailable
                    }
                    className={`h-12 w-12 items-center justify-center rounded-xl border-2 ${
                      selectedVariant.quantityAvailable > 0 &&
                      quantity >= selectedVariant.quantityAvailable
                        ? "border-muted bg-muted"
                        : "border-primary bg-primary/10"
                    }`}
                  >
                    <LucideIcon
                      name="Plus"
                      size={20}
                      color={
                        selectedVariant.quantityAvailable > 0 &&
                        quantity >= selectedVariant.quantityAvailable
                          ? theme.colors.mutedForeground
                          : theme.colors.primary
                      }
                    />
                  </Pressable>

                  {selectedVariant.quantityAvailable > 0 && (
                    <Text className="ml-4 text-sm text-muted-foreground">
                      Max: {selectedVariant.quantityAvailable}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Description */}
            <View className="mb-6">
              <Text className="mb-2 text-lg font-semibold text-foreground">Description</Text>
              <Text className="text-base leading-6 text-muted-foreground">
                {product.description}
              </Text>
            </View>

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

        {/* Add to Cart Button */}
        <View className="border-t border-border bg-background px-4 py-4">
          <Button
            onPress={handleAddToCart}
            disabled={!selectedVariant?.availableForSale || addToCart.isPending}
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
