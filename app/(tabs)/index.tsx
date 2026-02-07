import * as React from "react";
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import {
  useProducts,
  useCollections,
  useSearchProducts,
  useCustomer,
  useAddToCart,
} from "~/lib/shopify/hooks";
import { useCartContext } from "~/lib/contexts/CartContext";
import LucideIcon from "~/lib/icons/LucideIcon";
import { useTheme } from "~/theming/ThemeProvider";
import { useWishlist } from "~/lib/contexts/WishlistContext";
import { useAuth } from "~/lib/contexts/AuthContext";
import { router, useFocusEffect, useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerMenu } from "~/components/DrawerMenu";
import { ThemeToggle } from "~/components/ThemeToggle";
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
      className="mr-3 w-32 overflow-hidden rounded-2xl bg-card"
    >
      {collection.image ? (
        <Image source={{ uri: collection.image.url }} className="h-28 w-full" resizeMode="cover" />
      ) : (
        <View className="h-28 w-full items-center justify-center bg-muted">
          <LucideIcon name="Package" size={32} color={theme.colors.mutedForeground} />
        </View>
      )}
      <View className="p-2.5">
        <Text className="text-xs font-semibold text-center text-foreground" numberOfLines={1}>
          {collection.title}
        </Text>
      </View>
    </Pressable>
  );
}

function ProductCard({
  product,
  cartId,
  initializeCart,
}: {
  product: ShopifyProduct;
  cartId: string | null;
  initializeCart: () => Promise<string>;
}) {
  const { theme } = useTheme();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const addToCart = useAddToCart();
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

  const handleAddToCart = async (e: any) => {
    e.stopPropagation();

    if (!defaultVariant) {
      router.push(`/product/${product.handle}`);
      return;
    }

    try {
      let activeCartId = cartId;
      if (!activeCartId) {
        activeCartId = await initializeCart();
      }

      await addToCart.mutateAsync({
        cartId: activeCartId,
        merchandiseId: defaultVariant.id,
        quantity: 1,
      });

      Alert.alert("Added to Cart", `${product.title} has been added to your cart`);
    } catch (error) {
      console.error("Add to cart failed:", error);
      Alert.alert("Error", "Failed to add to cart. Please try again.");
    }
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
        <Text className="text-sm font-medium text-foreground mb-1" numberOfLines={2}>
          {product.title}
        </Text>
        <View className="mt-1 flex-row items-baseline gap-2">
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
      <Pressable
        onPress={handleAddToCart}
        disabled={!defaultVariant?.availableForSale || addToCart.isPending}
        className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary items-center justify-center shadow-md"
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

export default function ShopScreen() {
  const { theme } = useTheme();
  const { accessToken } = useAuth();
  const isLoggedIn = !!accessToken;
  const { data: customer } = useCustomer(accessToken);
  const { cartId, initializeCart } = useCartContext();
  const navigation = useNavigation();
  const [isReturningUser, setIsReturningUser] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Set custom header with menu button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row items-center gap-2 mr-4">
          <Pressable onPress={() => setDrawerOpen(true)}>
            <LucideIcon name="Menu" size={24} color={theme.colors.foreground} />
          </Pressable>
          <ThemeToggle />
        </View>
      ),
    });
  }, [navigation, theme]);

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

  // Check if returning user
  React.useEffect(() => {
    const checkReturningUser = async () => {
      if (customer?.id) {
        const key = `@beatrackfam:returning_user:${customer.id}`;
        const hasVisited = await AsyncStorage.getItem(key);
        setIsReturningUser(!!hasVisited);

        // Mark as visited for next time
        if (!hasVisited) {
          await AsyncStorage.setItem(key, "true");
        }
      }
    };
    checkReturningUser();
  }, [customer?.id]);

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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View className="px-4 pt-4 pb-3">
          <View className="flex-row items-center rounded-xl bg-muted px-4 py-3">
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
              Please check that your Shopify credentials are configured correctly in the environment
              variables.
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
            {/* Hero Banner - Only show when not searching */}
            {!debouncedSearch && (
              <View className="px-4 mb-6">
                <View
                  className="overflow-hidden rounded-2xl"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <View className="p-6">
                    {isLoggedIn ? (
                      // Logged-in user banner
                      <View className="items-center">
                        <Text
                          className="text-2xl font-bold text-center mb-2"
                          style={{ color: theme.colors.primaryForeground }}
                        >
                          {isReturningUser ? "Welcome Back" : "Welcome"}
                          {customer?.firstName ? `, ${customer.firstName}!` : ", Fam!"}
                        </Text>
                        <Text
                          className="text-sm text-center"
                          style={{ color: theme.colors.primaryForeground, opacity: 0.9 }}
                        >
                          Discover our latest drops and exclusives
                        </Text>
                      </View>
                    ) : (
                      // Guest user banner
                      <View className="items-center">
                        <Text
                          className="text-2xl font-bold text-center mb-2"
                          style={{ color: theme.colors.primaryForeground }}
                        >
                          Join the BeaTrackFam
                        </Text>
                        <Text
                          className="text-sm text-center mb-4"
                          style={{ color: theme.colors.primaryForeground, opacity: 0.9 }}
                        >
                          Sign up for exclusive access and early drops
                        </Text>
                        <View className="flex-row gap-3 w-full">
                          <Pressable
                            onPress={() => router.push("/auth/login")}
                            className="flex-1 rounded-xl py-3 border-2"
                            style={{ borderColor: theme.colors.primaryForeground }}
                          >
                            <Text
                              className="text-center font-semibold"
                              style={{ color: theme.colors.primaryForeground }}
                            >
                              Log In
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => router.push("/auth/signup")}
                            className="flex-1 rounded-xl py-3"
                            style={{ backgroundColor: theme.colors.primaryForeground }}
                          >
                            <Text
                              className="text-center font-semibold"
                              style={{ color: theme.colors.primary }}
                            >
                              Sign Up
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Collections */}
            {!debouncedSearch && collections && collections.length > 0 && (
              <View className="mb-6">
                <View className="px-4 mb-3 flex-row items-center justify-between">
                  <Text className="text-xl font-bold text-foreground">Collections</Text>
                  <Pressable onPress={() => router.push("/collections")}>
                    <Text className="text-sm font-medium text-primary">See All</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="pl-4"
                  contentContainerClassName="pr-4"
                >
                  {collections.slice(0, 4).map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Products Grid */}
            <View className="px-4 pb-6">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-xl font-bold text-foreground">
                  {debouncedSearch ? "Search Results" : "Featured Products"}
                </Text>
                {!debouncedSearch && (
                  <Pressable onPress={() => router.push("/products")}>
                    <Text className="text-sm font-medium text-primary">See All</Text>
                  </Pressable>
                )}
              </View>
              {products && products.length > 0 ? (
                <View className="flex-row flex-wrap justify-between">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      cartId={cartId}
                      initializeCart={initializeCart}
                    />
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
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}
