import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface WishlistContextType {
  wishlist: string[]; // Array of product IDs
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
}

const WishlistContext = React.createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_KEY = "@beatrackfam:wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = React.useState<string[]>([]);

  React.useEffect(() => {
    loadWishlist();
  }, []);

  React.useEffect(() => {
    if (wishlist.length >= 0) {
      AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist]);

  const loadWishlist = async () => {
    try {
      const saved = await AsyncStorage.getItem(WISHLIST_KEY);
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load wishlist:", error);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const addToWishlist = (productId: string) => {
    if (!wishlist.includes(productId)) {
      setWishlist([...wishlist, productId]);
    }
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(wishlist.filter((id) => id !== productId));
  };

  const toggleWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  return (
    <WishlistContext.Provider
      value={{ wishlist, isInWishlist, addToWishlist, removeFromWishlist, toggleWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = React.useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
