import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ShopifyCustomer } from "~/lib/shopify/types";
import * as ShopifyAPI from "./client";
import type { ShopifyProduct, ShopifyCollection, ShopifyCart } from "./types";
import { mockProducts, mockCollections } from "./mockData";

// Toggle this to use mock data (true) or real Shopify API (false)
const USE_MOCK_DATA = false;

// Products
export function useProducts(first = 20, after?: string) {
  return useQuery({
    queryKey: ["products", first, after],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        // Simulate API delay for realistic feel
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
          products: mockProducts.slice(0, first),
          hasNextPage: false,
          endCursor: null,
        };
      }
      return ShopifyAPI.getProducts(first, after);
    },
  });
}

export function useProduct(handle: string) {
  return useQuery({
    queryKey: ["product", handle],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return mockProducts.find((p) => p.handle === handle) || null;
      }
      return ShopifyAPI.getProductByHandle(handle);
    },
    enabled: !!handle,
  });
}

export function useSearchProducts(query: string, first = 20) {
  return useQuery({
    queryKey: ["products", "search", query, first],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const searchLower = query.toLowerCase();
        return mockProducts.filter(
          (p) =>
            p.title.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.productType.toLowerCase().includes(searchLower) ||
            p.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
        );
      }
      return ShopifyAPI.searchProducts(query, first);
    },
    enabled: query.length > 0,
  });
}

// Collections
export function useCollections(first = 10) {
  return useQuery({
    queryKey: ["collections", first],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return mockCollections.slice(0, first);
      }
      return ShopifyAPI.getCollections(first);
    },
  });
}

export function useCollection(handle: string, first = 250) {
  return useQuery({
    queryKey: ["collection", handle, first],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return mockCollections.find((c) => c.handle === handle) || null;
      }
      return ShopifyAPI.getCollectionByHandle(handle, first);
    },
    enabled: !!handle,
  });
}

// Cart - ALWAYS use real Shopify API for cart so checkout works!
export function useCart(cartId: string | null) {
  return useQuery({
    queryKey: ["cart", cartId],
    queryFn: () => (cartId ? ShopifyAPI.getCart(cartId) : null),
    enabled: !!cartId,
  });
}

export function useCreateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ShopifyAPI.createCart(),
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart", cart.id], cart);
    },
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cartId,
      merchandiseId,
      quantity,
    }: {
      cartId: string;
      merchandiseId: string;
      quantity?: number;
    }) => ShopifyAPI.addToCart(cartId, merchandiseId, quantity),
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart", cart.id], cart);
    },
  });
}

export function useUpdateCartLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cartId,
      lineId,
      quantity,
    }: {
      cartId: string;
      lineId: string;
      quantity: number;
    }) => ShopifyAPI.updateCartLine(cartId, lineId, quantity),
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart", cart.id], cart);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartId, lineIds }: { cartId: string; lineIds: string[] }) =>
      ShopifyAPI.removeFromCart(cartId, lineIds),
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart", cart.id], cart);
    },
  });
}

// Customer Auth - ALWAYS use real Shopify API
export function useCustomerLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      ShopifyAPI.customerLogin(email, password),
  });
}

export function useCustomerCreate() {
  return useMutation({
    mutationFn: ({
      email,
      password,
      firstName,
      lastName,
    }: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => ShopifyAPI.customerCreate(email, password, firstName, lastName),
  });
}

export function useCustomer(accessToken: string | null) {
  return useQuery({
    queryKey: ["customer", accessToken],
    queryFn: () => (accessToken ? ShopifyAPI.getCustomer(accessToken) : null),
    enabled: !!accessToken,
  });
}

export function useCustomerOrders(accessToken: string | null, first = 10) {
  return useQuery({
    queryKey: ["customer", "orders", accessToken, first],
    queryFn: () => (accessToken ? ShopifyAPI.getCustomerOrders(accessToken, first) : []),
    enabled: !!accessToken,
  });
}

export function useCustomerRecover() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => ShopifyAPI.customerRecover(email),
  });
}

export function useCustomerDelete() {
  return useMutation({
    mutationFn: ({ accessToken }: { accessToken: string }) =>
      ShopifyAPI.customerDelete(accessToken),
  });
}

export function useCustomerUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accessToken,
      customer,
    }: {
      accessToken: string;
      customer: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        acceptsMarketing?: boolean;
      };
    }) => ShopifyAPI.customerUpdate(accessToken, customer),
    onSuccess: (_data, variables) => {
      // Invalidate customer query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["customer", variables.accessToken] });

      // Optimistically update marketing preference so the toggle stays in sync immediately
      if (typeof variables.customer.acceptsMarketing === "boolean") {
        queryClient.setQueryData(
          ["customer", variables.accessToken],
          (previous: ShopifyCustomer | null | undefined) =>
            previous
              ? { ...previous, acceptsMarketing: variables.customer.acceptsMarketing }
              : previous,
        );
      }
    },
  });
}
