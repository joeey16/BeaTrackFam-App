module.exports = {
  name: "BeaTrackFam: Loyalty Above All",
  slug: "beatrackfaminc",
  version: "1.2.1",
  owner: "joeey16",
  scheme: "beatrackfaminc",
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/images/favicon.png",
    themeColor: undefined,
    name: undefined,
    shortName: undefined,
    lang: undefined,
    backgroundColor: undefined,
    description: undefined,
    orientation: undefined,
    startUrl: undefined,
  },
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
      "@stripe/stripe-react-native",
      { merchantIdentifier: "merchant.com.beatrackfaminc", enableGooglePay: true },
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

  experiments: { typedRoutes: true, tsconfigPaths: true },
  orientation: "portrait",
  icon: "https://v2-assets.draftbit.media/5b024a24a2/icon-2026-01-21T23:37:48.531Z.png",
  userInterfaceStyle: "automatic",
  extra: {
    EXPO_PUBLIC_SHOPIFY_DOMAIN: process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN,
    EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN:
      process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
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
    buildNumber: "20",
    bundleIdentifier: "com.beatrackfaminc",
    usesAppleSignIn: true,
    requireFullScreen: true,
    entitlements: {
      "com.apple.developer.in-app-payments": ["merchant.com.beatrackfaminc"],
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
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
      NSMicrophoneUsageDescription: undefined,
      NSPhotoLibraryAddUsageDescription: undefined,
      NSContactsUsageDescription: undefined,
      NSCalendarsUsageDescription: undefined,
      NSRemindersUsageDescription: undefined,
      NSMotionUsageDescription: undefined,
      NSFaceIDUsageDescription: undefined,
      NSSpeechRecognitionUsageDescription: undefined,
      NSBluetoothPeripheralUsageDescription: undefined,
      NSAppleMusicUsageDescription: undefined,
    },
    associatedDomains: undefined,
    appStoreUrl: undefined,
    isTabletOnly: undefined,
    privacyManifests: undefined,
    bitcode: undefined,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/appicon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.beatrackfaminc",
    versionCode: 20,
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
    blockedPermissions: undefined,
  },
  platforms: ["ios", "android", "web"],
  notification: {
    iosDisplayInForeground: true,
    androidMode: "default",
    icon: "./assets/appicon.png",
    color: undefined,
    androidCollapsedTitle: undefined,
  },
  description: undefined,
  locales: undefined,
  jsEngine: undefined,
};
