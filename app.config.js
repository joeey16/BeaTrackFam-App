const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

module.exports = {
  name: "BeaTrackFam Inc",
  slug: "beatrackfaminc",
  version: "1.4.5",
  owner: "joeey16",
  scheme: "beatrackfaminc",

  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    ["expo-apple-authentication", {}],
    "expo-font",
    "expo-asset",
    "expo-web-browser",
    "expo-image-picker",
    [
      "expo-tracking-transparency",
      {
        userTrackingPermission:
          "BeaTrackFam uses tracking to personalize your shopping experience and provide you with relevant product recommendations and exclusive offers.",
      },
    ],

    "expo-notifications",
    "expo-location",
    [
      "@stripe/stripe-react-native",
      {
        merchantIdentifier: "merchant.com.beatrackfaminc",
        enableGooglePay: true,
      },
    ],

    [
      "expo-router",
      {
        origin: "https://5b024a24a2.sandbox.draftbit.dev:5101",
        headOrigin: "https://5b024a24a2.sandbox.draftbit.dev:5100",
      },
    ],

    ["./plugins/draftbit-auto-launch-url-plugin"],
  ],

  experiments: {
    typedRoutes: true,
    tsconfigPaths: true,
  },

  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",

  extra: {
    EXPO_PUBLIC_SHOPIFY_DOMAIN: process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN,
    EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN:
      process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    EXPO_PUBLIC_FACEBOOK_APP_ID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    eas: {
      projectId: "b7ca1c99-c6e5-4c54-be20-04bc3ee66994",
    },
  },

  splash: {
    image: "./assets/appicon.png",
    resizeMode: "cover",
    backgroundColor: "#a1a1a1",
  },

  assetBundlePatterns: ["**/*"],

  ios: {
    supportsTablet: true,
    buildNumber: "145",
    bundleIdentifier: "com.beatrackfaminc",
    usesAppleSignIn: true,
    requireFullScreen: true,

    entitlements: {
      "com.apple.developer.in-app-payments": ["merchant.com.beatrackfaminc"],
    },

    infoPlist: {
      // Required for Facebook & Google Login redirects
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ["beatrackfaminc", ...(facebookAppId ? [`fb${facebookAppId}`] : [])],
        },
      ],

      LSApplicationQueriesSchemes: [
        "mailto",
        "fbapi",
        "fb-messenger-api",
        "fbauth2",
        "fbshareextension",
      ],

      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription:
        "This app needs access to your photo library to upload a profile picture.",
      NSLocationWhenInUseUsageDescription:
        "BeaTrackFam uses your location for accurate shipping estimates.",
      NSLocationAlwaysUsageDescription:
        "BeaTrackFam uses your location for accurate shipping estimates.",
      NSUserTrackingUsageDescription:
        "BeaTrackFam uses tracking to personalize your shopping experience.",
      NSCameraUsageDescription: "BeaTrackFam needs camera access to take profile photos.",
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.beatrackfaminc",
    versionCode: 145,
    permissions: [
      "INTERNET",
      "ACCESS_NETWORK_STATE",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "POST_NOTIFICATIONS",
      "com.google.android.gms.permission.AD_ID",
    ],

    allowBackup: true,
  },

  platforms: ["ios", "android", "web"],

  notification: {
    iosDisplayInForeground: true,
    androidMode: "default",
    icon: "./assets/icon.png",
  },
};
