import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCreateCart, useCart as useCartQuery } from "~/lib/shopify/hooks";

interface CartContextType {
  cartId: string | null;
  isLoading: boolean;
  initializeCart: () => Promise<string>;
  clearCart: () => Promise<void>;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

const CART_ID_KEY = "@beatrackfam:cart_id";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartId, setCartId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const createCart = useCreateCart();

  React.useEffect(() => {
    loadCartId();
  }, []);

  const loadCartId = async () => {
    try {
      const savedCartId = await AsyncStorage.getItem(CART_ID_KEY);
      setCartId(savedCartId);
    } catch (error) {
      console.error("Failed to load cart ID:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeCart = async (): Promise<string> => {
    try {
      const cart = await createCart.mutateAsync();
      await AsyncStorage.setItem(CART_ID_KEY, cart.id);
      setCartId(cart.id);
      return cart.id;
    } catch (error) {
      console.error("Failed to create cart:", error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await AsyncStorage.removeItem(CART_ID_KEY);
      setCartId(null);
    } catch (error) {
      console.error("Failed to clear cart:", error);
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{ cartId, isLoading, initializeCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return context;
}
