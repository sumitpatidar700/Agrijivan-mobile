import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguagesQuery, useOnboardingCatalogQuery, type OnboardingCategory } from "@/api";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { colors, radius } from "@/lib/theme";

const FALLBACK_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "??????" },
  { code: "te", label: "Telugu", nativeLabel: "??????" },
  { code: "kn", label: "Kannada", nativeLabel: "?????" },
  { code: "ta", label: "Tamil", nativeLabel: "?????" },
  { code: "bn", label: "Bengali", nativeLabel: "?????" },
  { code: "or", label: "Odia", nativeLabel: "?????" },
  { code: "ml", label: "Malayalam", nativeLabel: "??????" },
  { code: "as", label: "Assamese", nativeLabel: "???????" },
  { code: "mr", label: "Marathi", nativeLabel: "?????" },
  { code: "pa", label: "Punjabi", nativeLabel: "??????" },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setLanguage } = useLanguage();
  const { preferences, savePreferences } = useAuth();

  const { data: remoteLanguages, isLoading: langLoading } = useLanguagesQuery();
  const languages = remoteLanguages || FALLBACK_LANGUAGES;

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(preferences?.language || null);
  const [selectedItem, setSelectedItem] = useState<string | null>(preferences?.farming_items?.[0] || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedLanguage(preferences?.language || null);
    setSelectedItem(preferences?.farming_items?.[0] || null);
  }, [preferences?.language, preferences?.farming_items]);

  const {
    data: catalogCategories,
    isLoading: catalogLoading,
    isError: catalogError,
    refetch: refetchCatalog,
  } = useOnboardingCatalogQuery(selectedLanguage || preferences?.language || "en");

  const sortedCategories = useMemo(() => {
    if (!catalogCategories) return [];
    return [...catalogCategories].sort((a, b) => {
      const aIsAnimal = a.name.toLowerCase().includes("animal");
      const bIsAnimal = b.name.toLowerCase().includes("animal");
      if (aIsAnimal && !bIsAnimal) return -1;
      if (!aIsAnimal && bIsAnimal) return 1;
      return 0;
    });
  }, [catalogCategories]);

  const toggleExpand = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleToggleItem = (itemId: string) => {
    setSelectedItem((current) => (current === itemId ? null : itemId));
  };

  const handleSubmit = async () => {
    if (!selectedLanguage || !selectedItem) return;
    setIsSubmitting(true);
    try {
      await savePreferences(selectedLanguage, [selectedItem]);
      await setLanguage(selectedLanguage);
      router.back();
    } catch (err) {
      console.warn("Failed to update preferences:", err);
      alert("Preferences update failed, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = langLoading || catalogLoading;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your farming catalog...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View
          style={{
            backgroundColor: "#064e3b",
            position: "absolute",
            top: -1000,
            height: 1450,
            left: 0,
            right: 0,
            zIndex: -1,
          }}
        />

        <View style={[styles.header, { paddingTop: insets.top + 20 }]}> 
          <Pressable style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => (step === 1 ? router.back() : setStep(1))}>
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </Pressable>
          <Text style={styles.brandTitle}>Update Preferences</Text>
          <Text style={styles.brandSubtitle}>
            {step === 1 ? "Step 1 of 2 · Language Region" : "Step 2 of 2 · Farming Interests"}
          </Text>
        </View>

        <View style={styles.contentCard}>
          {step === 1 ? (
            <View style={styles.stepContainer}>
              <View>
                <Text style={styles.sectionTitle}>Choose Your Language Region</Text>
                <Text style={styles.sectionSubtitle}>
                  Select your preferred language region to explore customized products.
                </Text>
                <View style={styles.languageGrid}>
                  {languages.map((lang) => {
                    const isSelected = selectedLanguage === lang.code;
                    return (
                      <Pressable
                        key={lang.code}
                        style={[styles.languageCard, isSelected && styles.languageCardActive]}
                        onPress={() => {
                          setSelectedLanguage(lang.code);
                          setSelectedItem(null);
                        }}
                      >
                        {isSelected && (
                          <View style={styles.langCheck}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                        )}
                        <Text style={[styles.langNative, isSelected && styles.langTextActive]}>
                          {lang.nativeLabel || lang.label}
                        </Text>
                        <Text style={[styles.langEnglish, isSelected && styles.langSubActive]}>{lang.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                style={[styles.submitButton, !selectedLanguage && styles.submitButtonDisabled]}
                onPress={() => selectedLanguage && setStep(2)}
                disabled={!selectedLanguage}
              >
                <Text style={styles.submitButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.stepContainer}>
              <View>
                <Text style={styles.sectionTitle}>Select Farming Interest</Text>
                <Text style={styles.sectionSubtitle}>Choose the farming topic you want to explore.</Text>

                {catalogError && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
                    <Text style={styles.errorText}>Failed to load items.</Text>
                    <Pressable onPress={() => refetchCatalog()}>
                      <Text style={styles.retryText}>Tap to retry</Text>
                    </Pressable>
                  </View>
                )}

                {sortedCategories.map((group: OnboardingCategory) => {
                  const isExpanded = expandedCategories.has(group.id);
                  const limit = 6;
                  const visibleItems = isExpanded ? group.items : group.items.slice(0, limit);
                  const hasMore = group.items.length > limit;
                  const isCategorySelected = group.items.some((item) => selectedItem === item.id);

                  return (
                    <View key={group.id} style={styles.categorySection}>
                      <View style={styles.categoryHeaderWrap}>
                        <Text style={styles.categoryIcon}>{group.icon}</Text>
                        <Text style={styles.categoryHeading}>{group.name}</Text>
                        {isCategorySelected && <Text style={styles.categoryCount}>Selected</Text>}
                      </View>

                      <View style={styles.farmingGrid}>
                        {visibleItems.map((item) => {
                          const isSelected = selectedItem === item.id;
                          return (
                            <Pressable
                              key={item.id}
                              style={[styles.itemCard, isSelected && styles.itemCardActive]}
                              onPress={() => handleToggleItem(item.id)}
                            >
                              {isSelected && (
                                <View style={styles.selectBadge}>
                                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                                </View>
                              )}
                              {item.image ? (
                                <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
                              ) : (
                                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                                  <Text style={styles.itemImagePlaceholderText}>??</Text>
                                </View>
                              )}
                              <Text style={[styles.itemName, isSelected && styles.itemNameActive]} numberOfLines={2}>
                                {item.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {hasMore && (
                        <Pressable style={styles.viewAllBtn} onPress={() => toggleExpand(group.id)}>
                          <Text style={styles.viewAllText}>
                            {isExpanded ? "Show Less" : `View All ${group.items.length} items`}
                          </Text>
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={14}
                            color="#10b981"
                          />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>

              <View>
                {selectedItem && <Text style={styles.selectionCount}>Farming topic selected ?</Text>}
                <Pressable
                  style={[styles.submitButton, (!selectedItem || isSubmitting) && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={!selectedItem || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Save Preferences</Text>
                      <Ionicons name="checkmark-done" size={18} color="#ffffff" />
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollContainer: { flexGrow: 1, backgroundColor: "#ffffff" },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#064e3b",
    alignItems: "center",
    paddingBottom: 24,
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    left: 20,
    zIndex: 50,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  brandTitle: { fontSize: 22, fontWeight: "900", color: "#ffffff" },
  brandSubtitle: { fontSize: 12, color: "#d1fae5", marginTop: 4, fontWeight: "600" },
  contentCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  stepContainer: { flex: 1, justifyContent: "space-between" },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#064e3b" },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    marginBottom: 16,
    lineHeight: 16,
  },
  languageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  languageCard: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  languageCardActive: { borderColor: "#10b981", backgroundColor: "#f0fdf4" },
  langCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  langNative: { fontSize: 15, fontWeight: "700", color: "#064e3b" },
  langEnglish: { fontSize: 11, color: "#64748b", marginTop: 2 },
  langTextActive: { color: "#064e3b" },
  langSubActive: { color: "#059669" },
  categorySection: { marginBottom: 24 },
  categoryHeaderWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#e2e8f0",
  },
  categoryIcon: { fontSize: 16 },
  categoryHeading: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#064e3b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  categoryCount: { fontSize: 11, fontWeight: "700", color: "#10b981" },
  farmingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  itemCard: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    position: "relative",
    paddingBottom: 8,
  },
  itemCardActive: { borderColor: "#10b981", backgroundColor: "#f0fdf4" },
  itemImage: { width: "100%", height: 120, backgroundColor: "#e2e8f0" },
  itemImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
  },
  itemImagePlaceholderText: { fontSize: 30 },
  itemName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginTop: 6,
    paddingHorizontal: 8,
    textAlign: "left",
  },
  itemNameActive: { color: "#064e3b" },
  selectBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#10b981",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  selectionCount: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 8,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { fontSize: 13, color: "#ef4444", flex: 1 },
  retryText: { fontSize: 13, color: "#10b981", fontWeight: "700" },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  viewAllText: { fontSize: 12, fontWeight: "700", color: "#10b981" },
  submitButton: {
    backgroundColor: "#10b981",
    height: 52,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: { backgroundColor: "#cbd5e1", opacity: 0.7 },
  submitButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
});
