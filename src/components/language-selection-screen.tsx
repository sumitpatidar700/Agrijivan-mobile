import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useLanguagesQuery } from "@/api";
import { useLanguage } from "@/lib/language-context";
import { colors, radius, shadow } from "@/lib/theme";

import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "@agrijivan_cached_languages";

// Default fallback languages to ensure 0ms load even on the first run/offline
const FALLBACK_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" }
];

export function LanguageSelectionScreen() {
  const { setLanguage } = useLanguage();
  const { data: remoteLanguages, isLoading: isRemoteLoading, isError, error, refetch } = useLanguagesQuery();
  const [cachedLanguages, setCachedLanguages] = React.useState<any[] | null>(null);

  // Load from local storage cache instantly on mount
  React.useEffect(() => {
    async function loadCache() {
      try {
        const stored = await AsyncStorage.getItem(CACHE_KEY);
        if (stored) {
          setCachedLanguages(JSON.parse(stored));
        }
      } catch (err) {
        console.warn("Failed to load cached languages:", err);
      }
    }
    loadCache();
  }, []);

  // Save fresh data to cache when query succeeds
  React.useEffect(() => {
    if (remoteLanguages && remoteLanguages.length > 0) {
      setCachedLanguages(remoteLanguages);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remoteLanguages)).catch(() => {});
    }
  }, [remoteLanguages]);

  const handleSelect = (code: string) => {
    setLanguage(code);
  };

  const languages = cachedLanguages || remoteLanguages || FALLBACK_LANGUAGES;
  const isLoading = isRemoteLoading && !cachedLanguages;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={42} color={colors.surface} />
          </View>
          <Text style={styles.brandTitle}>AgriJivan</Text>
          <Text style={styles.brandSubtitle}>Empowering Farmers • किसानों का हमसफर</Text>
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.selectPromptTitle}>Choose Your Language</Text>
          <Text style={styles.selectPromptSubtitle}>अपनी भाषा का चयन करें</Text>

          {isLoading && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching available languages...</Text>
            </View>
          )}

          {isError && (
            <View style={styles.centerContent}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.red} />
              <Text style={styles.errorText}>
                {error?.message || "Failed to load languages. Please check your internet connection."}
              </Text>
              <Pressable style={styles.retryButton} onPress={() => refetch()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {!isLoading && !isError && languages && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.grid}>
                {languages.map((lang) => (
                  <Pressable
                    key={lang.code}
                    style={({ pressed }) => [
                      styles.languageCard,
                      pressed && styles.languageCardPressed,
                    ]}
                    onPress={() => handleSelect(lang.code)}
                  >
                    <View style={styles.languageIconWrap}>
                      <Text style={styles.languageInitial}>
                        {(lang.nativeLabel || lang.label || "?").charAt(0)}
                      </Text>
                    </View>
                    <Text style={styles.nativeLabel}>{lang.nativeLabel}</Text>
                    <Text style={styles.englishLabel}>{lang.label}</Text>
                    <View style={styles.arrowIcon}>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.header,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.header,
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 40,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.surface,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.textOnDarkMuted,
    marginTop: 4,
    fontWeight: "500",
  },
  cardContainer: {
    flex: 1,
    marginTop: -20,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  selectPromptTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  selectPromptSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  grid: {
    gap: 16,
  },
  languageCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    ...shadow,
    position: "relative",
  },
  languageCardPressed: {
    opacity: 0.85,
    backgroundColor: "#f0fdf4",
  },
  languageIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  languageInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  nativeLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  englishLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginRight: 24,
  },
  arrowIcon: {
    position: "absolute",
    right: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});
