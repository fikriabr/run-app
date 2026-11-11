import type { ExpoConfig } from "expo/config";

// Android release builds need a Google Maps key; without it the app draws routes with SVG instead.
const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

const config: ExpoConfig = {
  name: "Langkah",
  slug: "langkah",
  scheme: "langkah",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.langkah.app",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Langkah uses your location to measure distance and pace while you run.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Langkah keeps recording your run when the screen is locked or another app is open.",
      UIBackgroundModes: ["location", "audio"],
    },
  },
  android: {
    package: "com.langkah.app",
    adaptiveIcon: {
      backgroundColor: "#F7F4EF",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION",
    ],
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-sqlite",
    "expo-localization",
    [
      "expo-location",
      {
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 160,
        backgroundColor: "#F7F4EF",
        dark: { backgroundColor: "#12110F" },
      },
    ],
    ["react-native-maps", androidMapsKey ? { androidGoogleMapsApiKey: androidMapsKey } : {}],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    hasAndroidMapsKey: Boolean(androidMapsKey),
  },
};

export default config;
