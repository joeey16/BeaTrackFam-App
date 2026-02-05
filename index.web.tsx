import { registerRootComponent } from "expo";
import * as React from "react";
import "./.draftbit/init.js";

function App() {
  const { ExpoRoot } = require("expo-router");
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
