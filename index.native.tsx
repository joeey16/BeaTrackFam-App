import { registerRootComponent } from "expo";
import * as React from "react";
try {
  require("./.draftbit/init.js");
} catch (error) {
  console.warn("Draftbit init skipped:", error);
}

function App() {
  const { ExpoRoot } = require("expo-router");
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
