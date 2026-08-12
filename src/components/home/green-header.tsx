import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, View, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius } from "@/lib/theme";
import { t } from "@/lib/home-translations";
import { useActiveFarming } from "@/lib/active-farming-context";
import { CartBadge } from "@/components/ui/cart-badge";
import { AppSidebar } from "@/components/home/app-sidebar";

type GreenHeaderProps = {
  locale: string | null;
  onLanguagePress?: () => void;
  onSearchSubmit?: (text: string) => void;
  onCartPress?: () => void;
  onWishlistPress?: () => void;
  onCameraPress?: () => void;
  cartCount?: number;
  wishlistCount?: number;
  weatherTemp?: string;
  weatherLabel?: string;
};

export function GreenHeader({
  locale,
  onLanguagePress,
  onSearchSubmit,
  onCartPress,
  onWishlistPress,
  onCameraPress,
  cartCount = 5,
  wishlistCount = 3,
  weatherTemp = "28°C",
  weatherLabel,
}: GreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { activeFarming } = useActiveFarming();
  const [searchText, setSearchText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayWeatherLabel = weatherLabel ?? t(locale, "weatherSunny");
  const appSubtitleText = activeFarming ? `${activeFarming.name} Expert` : t(locale, "appSubtitle");
  const searchPlaceholderText = activeFarming
    ? `Search ${activeFarming.name} products...`
    : t(locale, "searchPlaceholder");

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      {/* Top Row */}
      <View style={styles.topRow}>
        {/* Hamburger menu */}
        <Pressable style={styles.menuBtn} onPress={() => setSidebarOpen(true)}>
          <Ionicons name="menu" size={22} color={colors.textOnDark} />
        </Pressable>

        {/* Logo + App Name */}
        <View style={styles.logoBlock}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../../../assets/icon.png")}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.appNameBlock}>
            <Text style={styles.appName}>{t(locale, "appName")}</Text>
            <Text style={styles.appSubtitle}>{appSubtitleText}</Text>
          </View>
        </View>

        {/* Weather widget */}
        <View style={styles.weatherBlock}>
          <Ionicons name="partly-sunny" size={20} color={colors.warning} />
          <View style={styles.weatherTextBlock}>
            <Text style={styles.weatherTemp}>{weatherTemp}</Text>
            <Text style={styles.weatherLabel}>{displayWeatherLabel}</Text>
          </View>
        </View>

        {/* Cart */}
        <View style={styles.iconRow}>
          <Pressable style={styles.iconBtn} onPress={onCartPress}>
            <Ionicons name="cart" size={18} color={colors.text} />
            <CartBadge count={cartCount} style={{ backgroundColor: colors.primary, borderColor: colors.surface }} />
          </Pressable>
        </View>
      </View>

      {/* Search Bar (Full Width) */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          placeholder={searchPlaceholderText}
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={() => onSearchSubmit?.(searchText)}
          returnKeyType="search"
        />
        <Pressable style={styles.cameraBtn} onPress={onCameraPress}>
          <Ionicons name="camera-outline" size={16} color={colors.surface} />
        </Pressable>
      </View>

      <AppSidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} locale={locale} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.header,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  menuBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  logoBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  appNameBlock: {
    flexShrink: 1,
  },
  appName: {
    color: colors.textOnDark,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  appSubtitle: {
    color: colors.textOnDarkMuted,
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  weatherBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
    marginHorizontal: 8,
  },
  weatherTextBlock: {
    alignItems: "center",
  },
  weatherTemp: {
    color: colors.textOnDark,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  weatherLabel: {
    color: colors.textOnDarkMuted,
    fontSize: 9,
    fontWeight: "500",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 7,
    gap: 8,
    width: "100%", // Full width search bar
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    padding: 0,
  },
  cameraBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
