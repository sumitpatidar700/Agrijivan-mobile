import React, { useEffect, useRef, useState } from "react";
import { Animated, View, Text, TextInput } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { Ionicons } from "@expo/vector-icons";

import { Providers } from "@/components/providers";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import LoginScreen from "./login";
import { OnboardingScreen } from "@/components/onboarding-screen";
import { SplashLoader, MinimalSplash } from "@/components/splash-loader";
import { CartFlyOverlay } from "@/components/ui/cart-fly-overlay";

// Globally override default font family for all Text and TextInput components
function applyGlobalFont() {
  const oldTextRender = (Text as any).render;
  if (!(Text as any).__manropePatch) {
    const originalDefaultProps = (Text as any).defaultProps ?? {};
    (Text as any).defaultProps = {
      ...originalDefaultProps,
      style: [{ fontFamily: "Manrope_400Regular" }, originalDefaultProps.style],
    };
    (Text as any).__manropePatch = true;
  }

  const originalInputDefaultProps = (TextInput as any).defaultProps ?? {};
  if (!(TextInput as any).__manropePatch) {
    (TextInput as any).defaultProps = {
      ...originalInputDefaultProps,
      style: [{ fontFamily: "Manrope_400Regular" }, originalInputDefaultProps.style],
    };
    (TextInput as any).__manropePatch = true;
  }
}

function FadeIn({ children, duration = 400 }: { children: React.ReactNode; duration?: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: true,
    }).start();
  }, [children]);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
}

const MIN_SPLASH_DURATION = 1500;

function NavigationLayout() {
  const { locale, setLanguage, isLoading: langLoading } = useLanguage();
  const { user, preferences, preferencesLoading, isLoading: authLoading } = useAuth();
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);

  // Sync app locale with user preferences once loaded
  useEffect(() => {
    if (preferences?.language && locale !== preferences.language) {
      setLanguage(preferences.language);
    }
  }, [preferences, locale]);

  // Keep the splash on screen for at least MIN_SPLASH_DURATION, even if auth/language/
  // preferences finish loading almost instantly - otherwise it can flash by too fast to
  // read the branding/quote.
  useEffect(() => {
    const timer = setTimeout(() => setMinDurationElapsed(true), MIN_SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  if (langLoading || authLoading || preferencesLoading || !minDurationElapsed) {
    return <SplashLoader />;
  }

  if (!user) {
    return (
      <FadeIn key="login-gate">
        <LoginScreen hideBackButton />
      </FadeIn>
    );
  }

  if (!preferences) {
    return (
      <FadeIn key="onboarding-gate">
        <OnboardingScreen />
      </FadeIn>
    );
  }

  return (
    <FadeIn key="app-navigation">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </FadeIn>
  );
}

export default function RootLayout() {
  // Ionicons.font is included here too, so `fontsLoaded` only flips once the icon font
  // SplashLoader depends on is actually ready - not just the Manrope text fonts.
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyGlobalFont();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <MinimalSplash />;
  }

  return (
    <Providers>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        <NavigationLayout />
        <CartFlyOverlay />
      </View>
    </Providers>
  );
}
