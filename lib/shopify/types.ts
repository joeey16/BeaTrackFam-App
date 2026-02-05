// Shopify Storefront API Types

export interface ShopifyImage {
  id: string;
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  image: ShopifyImage | null;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  images: {
    edges: Array<{
      node: ShopifyImage;
    }>;
  };
  variants: {
    edges: Array<{
      node: ShopifyProductVariant;
    }>;
  };
  options: Array<{
    id: string;
    name: string;
    values: string[];
  }>;
  availableForSale: boolean;
}

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
  products: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
    pageInfo?: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  discountCodes?: Array<{
    code: string;
    applicable: boolean;
  }>;
  cost: {
    totalAmount: ShopifyMoney;
    subtotalAmount: ShopifyMoney;
    totalTaxAmount: ShopifyMoney | null;
    totalDutyAmount: ShopifyMoney | null;
  };
  lines: {
    edges: Array<{
      node: ShopifyCartLine;
    }>;
  };
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  cost: {
    totalAmount: ShopifyMoney;
    amountPerQuantity: ShopifyMoney;
  };
  merchandise: ShopifyProductVariant;
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  phone: string | null;
  acceptsMarketing?: boolean;
  defaultAddress: ShopifyAddress | null;
  addresses: {
    edges: Array<{
      node: ShopifyAddress;
    }>;
  };
}

export interface ShopifyAddress {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  province: string | null;
  provinceCode: string | null;
  country: string;
  countryCodeV2: string;
  zip: string;
  phone: string | null;
}

export interface ShopifyOrder {
  id: string;
  orderNumber: number;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: ShopifyMoney;
  subtotalPrice: ShopifyMoney;
  totalShippingPrice: ShopifyMoney;
  totalTax: ShopifyMoney;
  currencyCode: string;
  statusUrl: string;
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        variant: {
          id: string;
          title: string;
          image: ShopifyImage | null;
          price: ShopifyMoney;
        } | null;
      };
    }>;
  };
  shippingAddress: ShopifyAddress | null;
}

export interface ShopifyCheckout {
  id: string;
  webUrl: string;
  totalPrice: ShopifyMoney;
  subtotalPrice: ShopifyMoney;
  totalTax: ShopifyMoney;
  lineItems: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        quantity: number;
        variant: ShopifyProductVariant;
      };
    }>;
  };
  shippingAddress: ShopifyAddress | null;
  shippingLine: {
    handle: string;
    title: string;
    price: ShopifyMoney;
  } | null;
  email: string | null;
  completedAt: string | null;
}

export interface ShopifyCustomerAccessToken {
  accessToken: string;
  expiresAt: string;
}
