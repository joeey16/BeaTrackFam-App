module.exports = {
  name: "BeaTrackFam: Loyalty Above All",
  slug: "beatrackfaminc",
  version: undefined,
  scheme: "beatrackfaminc",
  web: { bundler: "metro", output: "single", favicon: "./assets/images/favicon.png" },
  plugins: [
    "expo-font",
    "expo-asset",
    "expo-video",
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
      "expo-router",
      {
        origin: "https://5b024a24a2.sandbox.draftbit.dev:5101",
        headOrigin: "https://5b024a24a2.sandbox.draftbit.dev:5100",
      },
    ],
    ["./plugins/draftbit-auto-launch-url-plugin"],
  ],

  experiments: { typedRoutes: true, tsconfigPaths: true },
  orientation: "portrait",
  icon: "https://v2-assets.draftbit.media/5b024a24a2/icon-2026-01-21T23:37:48.531Z.png",
  userInterfaceStyle: "automatic",
  extra:
    "{\n    EXPO_PUBLIC_SHOPIFY_DOMAIN: process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN,\n    EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN:\n      process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,\n    EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,\n  }",

  splash: {
    image: "./assets/appicon.png",
    resizeMode: "cover",
    backgroundColor: "#a1a1a1",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    buildNumber: "9",
    bundleIdentifier: "com.beatrackfaminc",
    usesAppleSignIn: true,
    requireFullScreen: true,
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        "This app needs access to your photo library to upload a profile picture for your account.",
      NSLocationWhenInUseUsageDescription:
        "BeaTrackFam uses your location to provide accurate shipping estimates and help you find local events and pop-up shops.",
      NSLocationAlwaysUsageDescription:
        "BeaTrackFam uses your location to provide accurate shipping estimates and help you find local events and pop-up shops.",
      NSUserTrackingUsageDescription:
        "BeaTrackFam uses tracking to personalize your shopping experience and provide you with relevant product recommendations and exclusive offers.",
      NSCameraUsageDescription: "BeaTrackFam needs camera access to take photos for your profile.",
      LSApplicationQueriesSchemes: ["mailto"],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.beatrackfaminc",
    versionCode: 9,
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
  },
  platforms: ["ios", "android", "web"],
  notification: {
    iosDisplayInForeground: true,
    androidMode: "default",
    icon: "./assets/appicon.png",
  },
};
