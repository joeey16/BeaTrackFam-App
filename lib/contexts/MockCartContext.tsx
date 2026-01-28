import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ShopifyCart, ShopifyCartLine, ShopifyProductVariant } from "~/lib/shopify/types";
import { mockProducts } from "~/lib/shopify/mockData";

interface MockCartContextType {
  cart: ShopifyCart | null;
  addItem: (variantId: string, quantity: number) => void;
  updateItem: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
}

const MockCartContext = React.createContext<MockCartContextType | undefined>(undefined);

const MOCK_CART_KEY = "@beatrackfam:mock_cart";

export function MockCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = React.useState<ShopifyCart | null>(null);

  React.useEffect(() => {
    loadCart();
  }, []);

  React.useEffect(() => {
    if (cart) {
      AsyncStorage.setItem(MOCK_CART_KEY, JSON.stringify(cart));
    }
  }, [cart]);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem(MOCK_CART_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        createEmptyCart();
      }
    } catch (error) {
      console.error("Failed to load mock cart:", error);
      createEmptyCart();
    }
  };

  const createEmptyCart = () => {
    setCart({
      id: "mock-cart-" + Date.now(),
      checkoutUrl: "https://beatrackfam.info",
      totalQuantity: 0,
      cost: {
        totalAmount: { amount: "0.00", currencyCode: "USD" },
        subtotalAmount: { amount: "0.00", currencyCode: "USD" },
        totalTaxAmount: null,
        totalDutyAmount: null,
      },
      lines: { edges: [] },
    });
  };

  const findVariant = (variantId: string): ShopifyProductVariant | null => {
    for (const product of mockProducts) {
      const variant = product.variants.edges.find((v) => v.node.id === variantId);
      if (variant) {
        return {
          ...variant.node,
          product: {
            id: product.id,
            title: product.title,
            handle: product.handle,
          },
        } as any;
      }
    }
    return null;
  };

  const calculateTotal = (lines: ShopifyCartLine[]) => {
    const subtotal = lines.reduce((sum, line) => {
      return sum + parseFloat(line.cost.totalAmount.amount);
    }, 0);

    return {
      totalAmount: { amount: subtotal.toFixed(2), currencyCode: "USD" },
      subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: "USD" },
      totalTaxAmount: null,
      totalDutyAmount: null,
    };
  };

  const addItem = (variantId: string, quantity: number) => {
    if (!cart) {
      createEmptyCart();
      return;
    }

    const variant = findVariant(variantId);
    if (!variant) return;

    const existingLineIndex = cart.lines.edges.findIndex(
      ({ node }) => node.merchandise.id === variantId,
    );

    let newLines = [...cart.lines.edges];

    if (existingLineIndex >= 0) {
      // Update existing line
      const existingLine = newLines[existingLineIndex];
      const newQuantity = existingLine.node.quantity + quantity;
      const lineTotal = (parseFloat(variant.price.amount) * newQuantity).toFixed(2);

      newLines[existingLineIndex] = {
        node: {
          ...existingLine.node,
          quantity: newQuantity,
          cost: {
            totalAmount: { amount: lineTotal, currencyCode: "USD" },
            amountPerQuantity: variant.price,
          },
        },
      };
    } else {
      // Add new line
      const lineTotal = (parseFloat(variant.price.amount) * quantity).toFixed(2);
      newLines.push({
        node: {
          id: "mock-line-" + Date.now(),
          quantity,
          cost: {
            totalAmount: { amount: lineTotal, currencyCode: "USD" },
            amountPerQuantity: variant.price,
          },
          merchandise: variant,
        },
      });
    }

    const totalQuantity = newLines.reduce((sum, { node }) => sum + node.quantity, 0);

    setCart({
      ...cart,
      lines: { edges: newLines },
      totalQuantity,
      cost: calculateTotal(newLines.map(({ node }) => node)),
    });
  };

  const updateItem = (lineId: string, quantity: number) => {
    if (!cart) return;

    const lineIndex = cart.lines.edges.findIndex(({ node }) => node.id === lineId);
    if (lineIndex < 0) return;

    const newLines = [...cart.lines.edges];
    const line = newLines[lineIndex].node;
    const lineTotal = (parseFloat(line.merchandise.price.amount) * quantity).toFixed(2);

    newLines[lineIndex] = {
      node: {
        ...line,
        quantity,
        cost: {
          totalAmount: { amount: lineTotal, currencyCode: "USD" },
          amountPerQuantity: line.merchandise.price,
        },
      },
    };

    const totalQuantity = newLines.reduce((sum, { node }) => sum + node.quantity, 0);

    setCart({
      ...cart,
      lines: { edges: newLines },
      totalQuantity,
      cost: calculateTotal(newLines.map(({ node }) => node)),
    });
  };

  const removeItem = (lineId: string) => {
    if (!cart) return;

    const newLines = cart.lines.edges.filter(({ node }) => node.id !== lineId);
    const totalQuantity = newLines.reduce((sum, { node }) => sum + node.quantity, 0);

    setCart({
      ...cart,
      lines: { edges: newLines },
      totalQuantity,
      cost: calculateTotal(newLines.map(({ node }) => node)),
    });
  };

  const clearCart = () => {
    createEmptyCart();
  };

  return (
    <MockCartContext.Provider value={{ cart, addItem, updateItem, removeItem, clearCart }}>
      {children}
    </MockCartContext.Provider>
  );
}

export function useMockCart() {
  const context = React.useContext(MockCartContext);
  if (!context) {
    throw new Error("useMockCart must be used within MockCartProvider");
  }
  return context;
}
