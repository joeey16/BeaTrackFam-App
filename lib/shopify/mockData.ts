import type { ShopifyProduct, ShopifyCollection } from "./types";

// Mock products based on BeaTrackFam's actual products
export const mockProducts: ShopifyProduct[] = [
  {
    id: "gid://shopify/Product/1",
    handle: "beatrackfam-hoodie-black",
    title: "BeaTrackFam Hoodie - Black",
    description:
      "Premium quality hoodie featuring the iconic BeaTrackFam logo. Perfect for showing your loyalty.",
    descriptionHtml:
      "<p>Premium quality hoodie featuring the iconic BeaTrackFam logo. Perfect for showing your loyalty.</p>",
    vendor: "BeaTrackFam",
    productType: "Hoodies",
    tags: ["Apparel", "Hoodies", "Bestseller"],
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: "49.99", currencyCode: "USD" },
      maxVariantPrice: { amount: "49.99", currencyCode: "USD" },
    },
    images: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductImage/1",
            url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
            altText: "Black BeaTrackFam Hoodie",
            width: 800,
            height: 800,
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/1",
            title: "Small",
            availableForSale: true,
            quantityAvailable: 10,
            price: { amount: "49.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Size", value: "Small" }],
          },
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/2",
            title: "Medium",
            availableForSale: true,
            quantityAvailable: 15,
            price: { amount: "49.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Size", value: "Medium" }],
          },
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/3",
            title: "Large",
            availableForSale: true,
            quantityAvailable: 20,
            price: { amount: "49.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Size", value: "Large" }],
          },
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/4",
            title: "XL",
            availableForSale: true,
            quantityAvailable: 12,
            price: { amount: "49.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Size", value: "XL" }],
          },
        },
      ],
    },
    options: [
      {
        id: "gid://shopify/ProductOption/1",
        name: "Size",
        values: ["Small", "Medium", "Large", "XL"],
      },
    ],
  },
  {
    id: "gid://shopify/Product/2",
    handle: "beatrackfam-tshirt-white",
    title: "BeaTrackFam T-Shirt - White",
    description:
      "Classic white tee with BeaTrackFam branding. Comfortable, stylish, and perfect for everyday wear.",
    descriptionHtml:
      "<p>Classic white tee with BeaTrackFam branding. Comfortable, stylish, and perfect for everyday wear.</p>",
    vendor: "BeaTrackFam",
    productType: "T-Shirts",
    tags: ["Apparel", "T-Shirts", "Bestseller"],
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: "29.99", currencyCode: "USD" },
      maxVariantPrice: { amount: "29.99", currencyCode: "USD" },
    },
    images: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductImage/2",
            url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
            altText: "White BeaTrackFam T-Shirt",
            width: 800,
            height: 800,
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/5",
            title: "Small",
            availableForSale: true,
            quantityAvailable: 25,
            price: { amount: "29.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Size", value: "Small" }],
          },
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/6",
            title: "Medium",
            availableForSale: true,
            quantityAvailable: 30,
            price: { amount: "29.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Size", value: "Medium" }],
          },
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/7",
            title: "Large",
            availableForSale: true,
            quantityAvailable: 28,
            price: { amount: "29.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Size", value: "Large" }],
          },
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/8",
            title: "XL",
            availableForSale: true,
            quantityAvailable: 20,
            price: { amount: "29.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Size", value: "XL" }],
          },
        },
      ],
    },
    options: [
      {
        id: "gid://shopify/ProductOption/2",
        name: "Size",
        values: ["Small", "Medium", "Large", "XL"],
      },
    ],
  },
  {
    id: "gid://shopify/Product/3",
    handle: "beatrackfam-beanie",
    title: "BeaTrackFam Beanie",
    description:
      "Stay warm in style with the BeaTrackFam beanie. Embroidered logo, one size fits all.",
    descriptionHtml:
      "<p>Stay warm in style with the BeaTrackFam beanie. Embroidered logo, one size fits all.</p>",
    vendor: "BeaTrackFam",
    productType: "Accessories",
    tags: ["Accessories", "Beanies"],
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: "24.99", currencyCode: "USD" },
      maxVariantPrice: { amount: "24.99", currencyCode: "USD" },
    },
    images: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductImage/3",
            url: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800",
            altText: "BeaTrackFam Beanie",
            width: 800,
            height: 800,
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/9",
            title: "Default Title",
            availableForSale: true,
            quantityAvailable: 50,
            price: { amount: "24.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Title", value: "Default Title" }],
          },
        },
      ],
    },
    options: [
      {
        id: "gid://shopify/ProductOption/3",
        name: "Title",
        values: ["Default Title"],
      },
    ],
  },
  {
    id: "gid://shopify/Product/4",
    handle: "beatrackfam-ceramic-mug",
    title: "BeaTrackFam Ceramic Mug",
    description:
      "Start your day right with a BeaTrackFam ceramic mug. Dishwasher and microwave safe.",
    descriptionHtml:
      "<p>Start your day right with a BeaTrackFam ceramic mug. Dishwasher and microwave safe.</p>",
    vendor: "BeaTrackFam",
    productType: "Drinkware",
    tags: ["Accessories", "Mugs"],
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: "19.99", currencyCode: "USD" },
      maxVariantPrice: { amount: "19.99", currencyCode: "USD" },
    },
    images: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductImage/4",
            url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800",
            altText: "BeaTrackFam Ceramic Mug",
            width: 800,
            height: 800,
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/10",
            title: "Default Title",
            availableForSale: true,
            quantityAvailable: 100,
            price: { amount: "19.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Title", value: "Default Title" }],
          },
        },
      ],
    },
    options: [
      {
        id: "gid://shopify/ProductOption/4",
        name: "Title",
        values: ["Default Title"],
      },
    ],
  },
  {
    id: "gid://shopify/Product/5",
    handle: "beatrackfam-sherpa-jacket",
    title: "BeaTrackFam Sherpa Fleece Jacket",
    description:
      "Premium sherpa fleece jacket with BeaTrackFam embroidery. Ultra-warm and comfortable.",
    descriptionHtml:
      "<p>Premium sherpa fleece jacket with BeaTrackFam embroidery. Ultra-warm and comfortable.</p>",
    vendor: "BeaTrackFam",
    productType: "Jackets",
    tags: ["Apparel", "Jackets", "Premium"],
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: "79.99", currencyCode: "USD" },
      maxVariantPrice: { amount: "79.99", currencyCode: "USD" },
    },
    images: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductImage/5",
            url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
            altText: "BeaTrackFam Sherpa Jacket",
            width: 800,
            height: 800,
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/11",
            title: "Small",
            availableForSale: true,
            quantityAvailable: 5,
            price: { amount: "79.99", currencyCode: "USD" },
            compareAtPrice: { amount: "99.99", currencyCode: "USD" },
            image: null,
            selectedOptions: [{ name: "Size", value: "Small" }],
          },
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/12",
            title: "Medium",
            availableForSale: true,
            quantityAvailable: 8,
            price: { amount: "79.99", currencyCode: "USD" },
            compareAtPrice: { amount: "99.99", currencyCode: "USD" },
            image: null,
            selectedOptions: [{ name: "Size", value: "Medium" }],
          },
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/13",
            title: "Large",
            availableForSale: true,
            quantityAvailable: 10,
            price: { amount: "79.99", currencyCode: "USD" },
            compareAtPrice: { amount: "99.99", currencyCode: "USD" },
            image: null,
            selectedOptions: [{ name: "Size", value: "Large" }],
          },
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/14",
            title: "XL",
            availableForSale: true,
            quantityAvailable: 6,
            price: { amount: "79.99", currencyCode: "USD" },
            compareAtPrice: { amount: "99.99", currencyCode: "USD" },
            image: null,
            selectedOptions: [{ name: "Size", value: "XL" }],
          },
        },
      ],
    },
    options: [
      {
        id: "gid://shopify/ProductOption/5",
        name: "Size",
        values: ["Small", "Medium", "Large", "XL"],
      },
    ],
  },
  {
    id: "gid://shopify/Product/6",
    handle: "beatrackfam-basketball-jersey",
    title: "BeaTrackFam Basketball Jersey",
    description:
      "Rep your crew on the court with the official BeaTrackFam basketball jersey. Premium mesh fabric.",
    descriptionHtml:
      "<p>Rep your crew on the court with the official BeaTrackFam basketball jersey. Premium mesh fabric.</p>",
    vendor: "BeaTrackFam",
    productType: "Jerseys",
    tags: ["Apparel", "Jerseys", "Sports"],
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: "39.99", currencyCode: "USD" },
      maxVariantPrice: { amount: "39.99", currencyCode: "USD" },
    },
    images: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductImage/6",
            url: "https://images.unsplash.com/photo-1627225925683-1da7d5d3a6c1?w=800",
            altText: "BeaTrackFam Basketball Jersey",
            width: 800,
            height: 800,
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/15",
            title: "Small",
            availableForSale: true,
            quantityAvailable: 12,
            price: { amount: "39.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Size", value: "Small" }],
          },
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/16",
            title: "Medium",
            availableForSale: true,
            quantityAvailable: 18,
            price: { amount: "39.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Size", value: "Medium" }],
          },
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/17",
            title: "Large",
            availableForSale: true,
            quantityAvailable: 15,
            price: { amount: "39.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Size", value: "Large" }],
          },
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/18",
            title: "XL",
            availableForSale: true,
            quantityAvailable: 10,
            price: { amount: "39.99", currencyCode: "USD" },
            compareAtPrice: null,
            image: null,
            selectedOptions: [{ name: "Size", value: "XL" }],
          },
        },
      ],
    },
    options: [
      {
        id: "gid://shopify/ProductOption/6",
        name: "Size",
        values: ["Small", "Medium", "Large", "XL"],
      },
    ],
  },
];

export const mockCollections: ShopifyCollection[] = [
  {
    id: "gid://shopify/Collection/1",
    handle: "apparel",
    title: "Apparel",
    description: "Premium BeaTrackFam clothing",
    image: {
      id: "gid://shopify/CollectionImage/1",
      url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800",
      altText: "Apparel Collection",
      width: 800,
      height: 800,
    },
    products: {
      edges: mockProducts
        .filter(
          (p) =>
            p.productType === "Hoodies" ||
            p.productType === "T-Shirts" ||
            p.productType === "Jackets" ||
            p.productType === "Jerseys",
        )
        .map((product) => ({ node: product })),
    },
  },
  {
    id: "gid://shopify/Collection/2",
    handle: "accessories",
    title: "Accessories",
    description: "Complete your look",
    image: {
      id: "gid://shopify/CollectionImage/2",
      url: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800",
      altText: "Accessories Collection",
      width: 800,
      height: 800,
    },
    products: {
      edges: mockProducts
        .filter((p) => p.productType === "Accessories" || p.productType === "Drinkware")
        .map((product) => ({ node: product })),
    },
  },
  {
    id: "gid://shopify/Collection/3",
    handle: "bestsellers",
    title: "Bestsellers",
    description: "Our most popular items",
    image: {
      id: "gid://shopify/CollectionImage/3",
      url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
      altText: "Bestsellers Collection",
      width: 800,
      height: 800,
    },
    products: {
      edges: mockProducts
        .filter((p) => p.tags.includes("Bestseller"))
        .map((product) => ({ node: product })),
    },
  },
];
