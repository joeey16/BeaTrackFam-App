import Constants from "expo-constants";
import type {
  ShopifyProduct,
  ShopifyCollection,
  ShopifyCart,
  ShopifyCustomer,
  ShopifyOrder,
  ShopifyCustomerAccessToken,
} from "./types";

// Access environment variables - try both methods for compatibility
const SHOPIFY_DOMAIN =
  process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN || Constants.expoConfig?.extra?.EXPO_PUBLIC_SHOPIFY_DOMAIN;
const STOREFRONT_ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

if (!SHOPIFY_DOMAIN || !STOREFRONT_ACCESS_TOKEN) {
  console.warn(
    "⚠️ Missing Shopify credentials. Please set EXPO_PUBLIC_SHOPIFY_DOMAIN and EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN",
  );
}

// Check for placeholder values
if (
  SHOPIFY_DOMAIN?.includes("YOUR_") ||
  STOREFRONT_ACCESS_TOKEN?.includes("YOUR_") ||
  SHOPIFY_DOMAIN?.includes("DOMAIN") ||
  STOREFRONT_ACCESS_TOKEN?.includes("TOKEN")
) {
  console.error(
    "❌ Shopify credentials are still set to placeholder values. Please update them with your actual Shopify store credentials.",
  );
}

// Try multiple API versions for compatibility
const API_VERSIONS = ["2025-01", "2024-10", "2024-07", "2024-04", "2024-01", "unstable"];

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function shopifyFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  // Check if credentials are configured
  if (!SHOPIFY_DOMAIN || !STOREFRONT_ACCESS_TOKEN) {
    throw new Error(
      "Shopify credentials not configured. Please set EXPO_PUBLIC_SHOPIFY_DOMAIN and EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN in your environment variables.",
    );
  }

  // Check for placeholder values
  if (
    SHOPIFY_DOMAIN.includes("YOUR_") ||
    STOREFRONT_ACCESS_TOKEN.includes("YOUR_") ||
    SHOPIFY_DOMAIN.includes("DOMAIN") ||
    STOREFRONT_ACCESS_TOKEN.includes("TOKEN")
  ) {
    throw new Error(
      "Shopify credentials are still set to placeholder values. Please update EXPO_PUBLIC_SHOPIFY_DOMAIN to 'md8kiz-xp.myshopify.com' and EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN to your actual Storefront API access token.",
    );
  }

  // Try each API version until one works
  let lastError: Error | null = null;

  for (const version of API_VERSIONS) {
    const apiUrl = `https://${SHOPIFY_DOMAIN}/api/${version}/graphql.json`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN || "",
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(
          `API ${version} failed (${response.status}): ${response.statusText}. ${errorText}`,
        );
        continue; // Try next version
      }

      const json: GraphQLResponse<T> = await response.json();

      if (json.errors) {
        lastError = new Error(`GraphQL errors: ${json.errors.map((e) => e.message).join(", ")}`);
        continue; // Try next version
      }

      if (!json.data) {
        lastError = new Error("No data returned from API");
        continue;
      }

      // Success! Log which version worked
      console.log(`✅ Shopify API ${version} working`);
      return json.data;
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }

  // All versions failed
  throw new Error(
    `All Shopify API versions failed. Last error: ${lastError?.message || "Unknown error"}. This likely means the Storefront API is not enabled on your store. Please enable it in Shopify admin.`,
  );
}

// Fragment for product details
const PRODUCT_FRAGMENT = `
  fragment ProductFragment on Product {
    id
    handle
    title
    description
    descriptionHtml
    vendor
    productType
    tags
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 10) {
      edges {
        node {
          id
          url
          altText
          width
          height
        }
      }
    }
    variants(first: 50) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          image {
            id
            url
            altText
            width
            height
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
    options {
      id
      name
      values
    }
  }
`;

// Get all products
export async function getProducts(
  first = 20,
  after?: string,
): Promise<{
  products: ShopifyProduct[];
  hasNextPage: boolean;
  endCursor: string | null;
}> {
  const query = `
    ${PRODUCT_FRAGMENT}
    query GetProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            ...ProductFragment
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: Array<{ node: ShopifyProduct }>;
    };
  }>(query, { first, after });

  return {
    products: data.products.edges.map((edge) => edge.node),
    hasNextPage: data.products.pageInfo.hasNextPage,
    endCursor: data.products.pageInfo.endCursor,
  };
}

// Get product by handle
export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const query = `
    ${PRODUCT_FRAGMENT}
    query GetProduct($handle: String!) {
      productByHandle(handle: $handle) {
        ...ProductFragment
      }
    }
  `;

  const data = await shopifyFetch<{ productByHandle: ShopifyProduct | null }>(query, { handle });
  return data.productByHandle;
}

// Get collections
export async function getCollections(first = 10): Promise<ShopifyCollection[]> {
  const query = `
    query GetCollections($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            id
            handle
            title
            description
            image {
              id
              url
              altText
              width
              height
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    collections: { edges: Array<{ node: ShopifyCollection }> };
  }>(query, { first });

  return data.collections.edges.map((edge) => edge.node);
}

// Get collection by handle with products
export async function getCollectionByHandle(
  handle: string,
  first = 250,
  after?: string | null,
): Promise<ShopifyCollection | null> {
  const query = `
    ${PRODUCT_FRAGMENT}
    query GetCollection($handle: String!, $first: Int!, $after: String) {
      collectionByHandle(handle: $handle) {
        id
        handle
        title
        description
        image {
          id
          url
          altText
          width
          height
        }
        products(first: $first, after: $after) {
          edges {
            node {
              ...ProductFragment
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ collectionByHandle: ShopifyCollection | null }>(query, {
    handle,
    first,
    after: after ?? null,
  });

  return data.collectionByHandle;
}

export async function getCollectionProductCount(handle: string, first = 250): Promise<number> {
  const query = `
    query GetCollectionProductCount($handle: String!, $first: Int!, $after: String) {
      collectionByHandle(handle: $handle) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  let after: string | null = null;
  let total = 0;

  do {
    const data = await shopifyFetch<{
      collectionByHandle: {
        products: {
          edges: Array<{ node: { id: string }; cursor: string }>;
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
        };
      } | null;
    }>(query, { handle, first, after });

    if (!data.collectionByHandle) {
      return 0;
    }

    const { edges, pageInfo } = data.collectionByHandle.products;
    total += edges.length;
    after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (after);

  return total;
}

// Search products
export async function searchProducts(query: string, first = 20): Promise<ShopifyProduct[]> {
  const searchQuery = `
    ${PRODUCT_FRAGMENT}
    query SearchProducts($query: String!, $first: Int!) {
      products(first: $first, query: $query) {
        edges {
          node {
            ...ProductFragment
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    products: { edges: Array<{ node: ShopifyProduct }> };
  }>(searchQuery, { query, first });

  return data.products.edges.map((edge) => edge.node);
}

// Create cart
export async function createCart(): Promise<ShopifyCart> {
  const mutation = `
    mutation CreateCart {
      cartCreate {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
            totalDutyAmount {
              amount
              currencyCode
            }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                cost {
                  totalAmount {
                    amount
                    currencyCode
                  }
                  amountPerQuantity {
                    amount
                    currencyCode
                  }
                }
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    availableForSale
                    quantityAvailable
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    image {
                      id
                      url
                      altText
                      width
                      height
                    }
                    product {
                      id
                      title
                      handle
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ cartCreate: { cart: ShopifyCart } }>(mutation);
  return data.cartCreate.cart;
}

// Add item to cart
export async function addToCart(
  cartId: string,
  merchandiseId: string,
  quantity = 1,
): Promise<ShopifyCart> {
  const mutation = `
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
            totalDutyAmount {
              amount
              currencyCode
            }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                cost {
                  totalAmount {
                    amount
                    currencyCode
                  }
                  amountPerQuantity {
                    amount
                    currencyCode
                  }
                }
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    availableForSale
                    quantityAvailable
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    image {
                      id
                      url
                      altText
                      width
                      height
                    }
                    product {
                      id
                      title
                      handle
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ cartLinesAdd: { cart: ShopifyCart } }>(mutation, {
    cartId,
    lines: [{ merchandiseId, quantity }],
  });

  return data.cartLinesAdd.cart;
}

// Update cart line quantity
export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<ShopifyCart> {
  const mutation = `
    mutation UpdateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                cost {
                  totalAmount {
                    amount
                    currencyCode
                  }
                  amountPerQuantity {
                    amount
                    currencyCode
                  }
                }
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    availableForSale
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    image {
                      id
                      url
                      altText
                      width
                      height
                    }
                    product {
                      id
                      title
                      handle
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ cartLinesUpdate: { cart: ShopifyCart } }>(mutation, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });

  return data.cartLinesUpdate.cart;
}

// Remove item from cart
export async function removeFromCart(cartId: string, lineIds: string[]): Promise<ShopifyCart> {
  const mutation = `
    mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id
          totalQuantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    product {
                      id
                      title
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ cartLinesRemove: { cart: ShopifyCart } }>(mutation, {
    cartId,
    lineIds,
  });

  return data.cartLinesRemove.cart;
}

// Get cart by ID
export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const query = `
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        checkoutUrl
        totalQuantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
        }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  image {
                    url
                    altText
                  }
                  product {
                    id
                    title
                    handle
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ cart: ShopifyCart | null }>(query, { cartId });
  return data.cart;
}

// Customer authentication
export async function customerLogin(
  email: string,
  password: string,
): Promise<ShopifyCustomerAccessToken> {
  const mutation = `
    mutation CustomerLogin($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: ShopifyCustomerAccessToken | null;
      customerUserErrors: Array<{ message: string }>;
    };
  }>(mutation, { input: { email, password } });

  if (data.customerAccessTokenCreate.customerUserErrors.length > 0) {
    throw new Error(
      data.customerAccessTokenCreate.customerUserErrors.map((e) => e.message).join(", "),
    );
  }

  if (!data.customerAccessTokenCreate.customerAccessToken) {
    throw new Error("Failed to create customer access token");
  }

  return data.customerAccessTokenCreate.customerAccessToken;
}

// Get customer info
export async function getCustomer(accessToken: string): Promise<ShopifyCustomer> {
  const query = `
    query GetCustomer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        email
        firstName
        lastName
        displayName
        phone
        acceptsMarketing
        defaultAddress {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          province
          provinceCode
          country
          countryCodeV2
          zip
          phone
        }
        addresses(first: 10) {
          edges {
            node {
              id
              firstName
              lastName
              company
              address1
              address2
              city
              province
              provinceCode
              country
              countryCodeV2
              zip
              phone
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ customer: ShopifyCustomer }>(query, {
    customerAccessToken: accessToken,
  });

  return data.customer;
}

// Get customer orders
export async function getCustomerOrders(accessToken: string, first = 10): Promise<ShopifyOrder[]> {
  const query = `
    query GetCustomerOrders($customerAccessToken: String!, $first: Int!) {
      customer(customerAccessToken: $customerAccessToken) {
        orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              orderNumber
              name
              processedAt
              financialStatus
              fulfillmentStatus
              totalPrice {
                amount
                currencyCode
              }
              subtotalPrice {
                amount
                currencyCode
              }
              totalShippingPrice {
                amount
                currencyCode
              }
              totalTax {
                amount
                currencyCode
              }
              currencyCode
              statusUrl
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    quantity
                    variant {
                      id
                      title
                      image {
                        url
                        altText
                      }
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
              shippingAddress {
                firstName
                lastName
                address1
                address2
                city
                province
                country
                zip
                phone
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    customer: { orders: { edges: Array<{ node: ShopifyOrder }> } };
  }>(query, { customerAccessToken: accessToken, first });

  return data.customer.orders.edges.map((edge) => edge.node);
}

// Create customer account
export async function customerCreate(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
): Promise<ShopifyCustomerAccessToken> {
  const mutation = `
    mutation CustomerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    customerCreate: {
      customer: { id: string } | null;
      customerUserErrors: Array<{ message: string }>;
    };
  }>(mutation, {
    input: { email, password, firstName, lastName },
  });

  if (data.customerCreate.customerUserErrors.length > 0) {
    throw new Error(data.customerCreate.customerUserErrors.map((e) => e.message).join(", "));
  }

  // After creating, log them in
  return customerLogin(email, password);
}

// Customer password recovery
export async function customerRecover(email: string): Promise<void> {
  const mutation = `
    mutation CustomerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    customerRecover: {
      customerUserErrors: Array<{ message: string }>;
    };
  }>(mutation, { email });

  if (data.customerRecover.customerUserErrors.length > 0) {
    throw new Error(data.customerRecover.customerUserErrors.map((e) => e.message).join(", "));
  }
}

// Customer account deletion
export async function customerDelete(accessToken: string): Promise<void> {
  const mutation = `
    mutation CustomerDelete($customerAccessToken: String!) {
      customerDelete(customerAccessToken: $customerAccessToken) {
        deletedCustomerId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    customerDelete: {
      deletedCustomerId: string | null;
      userErrors: Array<{ message: string }>;
    };
  }>(mutation, { customerAccessToken: accessToken });

  if (data.customerDelete.userErrors.length > 0) {
    throw new Error(data.customerDelete.userErrors.map((e) => e.message).join(", "));
  }

  if (!data.customerDelete.deletedCustomerId) {
    throw new Error("Failed to delete customer account");
  }
}

// Customer profile update
export async function customerUpdate(
  accessToken: string,
  customer: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    acceptsMarketing?: boolean;
  },
): Promise<{ accessToken: string }> {
  const mutation = `
    mutation CustomerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
        customer {
          id
          firstName
          lastName
          email
          phone
          acceptsMarketing
        }
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    customerUpdate: {
      customer: any;
      customerAccessToken: { accessToken: string; expiresAt: string } | null;
      customerUserErrors: Array<{ message: string }>;
    };
  }>(mutation, { customerAccessToken: accessToken, customer });

  if (data.customerUpdate.customerUserErrors.length > 0) {
    throw new Error(data.customerUpdate.customerUserErrors.map((e) => e.message).join(", "));
  }

  // Return the new access token if provided, otherwise return the original
  if (data.customerUpdate.customerAccessToken) {
    return { accessToken: data.customerUpdate.customerAccessToken.accessToken };
  } else {
    // Shopify didn't return a new token, use the existing one
    return { accessToken: accessToken };
  }
}

// Customer address create
export async function customerAddressCreate(
  accessToken: string,
  address: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    country: string;
    zip: string;
    phone?: string;
  },
): Promise<{ addressId: string }> {
  const mutation = `
    mutation CustomerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
      customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
        customerAddress {
          id
        }
        customerUserErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    customerAddressCreate: {
      customerAddress: { id: string } | null;
      customerUserErrors: Array<{ message: string }>;
    };
  }>(mutation, { customerAccessToken: accessToken, address });

  if (data.customerAddressCreate.customerUserErrors.length > 0) {
    throw new Error(data.customerAddressCreate.customerUserErrors.map((e) => e.message).join(", "));
  }

  if (!data.customerAddressCreate.customerAddress?.id) {
    throw new Error("Failed to create address");
  }

  return { addressId: data.customerAddressCreate.customerAddress.id };
}

// Customer address update
export async function customerAddressUpdate(
  accessToken: string,
  addressId: string,
  address: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
    phone?: string;
  },
): Promise<{ addressId: string }> {
  const mutation = `
    mutation CustomerAddressUpdate(
      $customerAccessToken: String!,
      $id: ID!,
      $address: MailingAddressInput!
    ) {
      customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
        customerAddress {
          id
        }
        customerUserErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    customerAddressUpdate: {
      customerAddress: { id: string } | null;
      customerUserErrors: Array<{ message: string }>;
    };
  }>(mutation, { customerAccessToken: accessToken, id: addressId, address });

  if (data.customerAddressUpdate.customerUserErrors.length > 0) {
    throw new Error(data.customerAddressUpdate.customerUserErrors.map((e) => e.message).join(", "));
  }

  if (!data.customerAddressUpdate.customerAddress?.id) {
    throw new Error("Failed to update address");
  }

  return { addressId: data.customerAddressUpdate.customerAddress.id };
}

// Customer address delete
export async function customerAddressDelete(
  accessToken: string,
  addressId: string,
): Promise<{ deletedAddressId: string }> {
  const mutation = `
    mutation CustomerAddressDelete($customerAccessToken: String!, $id: ID!) {
      customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
        deletedCustomerAddressId
        customerUserErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    customerAddressDelete: {
      deletedCustomerAddressId: string | null;
      customerUserErrors: Array<{ message: string }>;
    };
  }>(mutation, { customerAccessToken: accessToken, id: addressId });

  if (data.customerAddressDelete.customerUserErrors.length > 0) {
    throw new Error(data.customerAddressDelete.customerUserErrors.map((e) => e.message).join(", "));
  }

  if (!data.customerAddressDelete.deletedCustomerAddressId) {
    throw new Error("Failed to delete address");
  }

  return { deletedAddressId: data.customerAddressDelete.deletedCustomerAddressId };
}

// Customer default address update
export async function customerDefaultAddressUpdate(
  accessToken: string,
  addressId: string,
): Promise<{ addressId: string }> {
  const mutation = `
    mutation CustomerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
      customerDefaultAddressUpdate(
        customerAccessToken: $customerAccessToken,
        addressId: $addressId
      ) {
        customer {
          defaultAddress {
            id
          }
        }
        customerUserErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    customerDefaultAddressUpdate: {
      customer: { defaultAddress: { id: string } | null } | null;
      customerUserErrors: Array<{ message: string }>;
    };
  }>(mutation, { customerAccessToken: accessToken, addressId });

  if (data.customerDefaultAddressUpdate.customerUserErrors.length > 0) {
    throw new Error(
      data.customerDefaultAddressUpdate.customerUserErrors.map((e) => e.message).join(", "),
    );
  }

  if (!data.customerDefaultAddressUpdate.customer?.defaultAddress?.id) {
    throw new Error("Failed to update default address");
  }

  return { addressId: data.customerDefaultAddressUpdate.customer.defaultAddress.id };
}
