const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
// eslint-disable-next-line no-undef
const config = getDefaultConfig(__dirname);

config.cacheStores = ({ FileStore }) => [
  new FileStore({
    root: ".metro-cache",
  }),
];

config.cacheVersion = "0";
if (process.env.EXPO_PUBLIC_PROJECT_PATH) {
  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    "expo-notifications": path.resolve(__dirname, "lib/stubs/expo-notifications"),
    "expo-location": path.resolve(__dirname, "lib/stubs/expo-location"),
  };
}

module.exports = withNativeWind(config, { input: "./global.css" });
