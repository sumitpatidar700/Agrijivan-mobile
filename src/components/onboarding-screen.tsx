import React, { useState, useEffect } from "react";
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
import { useLanguagesQuery, useOnboardingCatalogQuery, type OnboardingCategory } from "@/api";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { colors, radius } from "@/lib/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FALLBACK_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "or", label: "Odia", nativeLabel: "ଓଡ଼ିଆ" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളం" },
  { code: "as", label: "Assamese", nativeLabel: "অসমীয়া" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ" }
];

const TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: {
    "Welcome to AgriJivan": "कृषिजीवन में आपका स्वागत है",
    "Step 1 of 2 · Language Region": "चरण 1: भाषा और क्षेत्र",
    "Step 2 of 2 · Farming Interests": "चरण 2: खेती के विषय",
    "Choose Your Language Region": "अपना भाषा क्षेत्र चुनें",
    "Select your preferred language region to explore customized products": "अपनी पसंद के अनुसार उत्पाद देखने के लिए पसंदीदा भाषा क्षेत्र का चयन करें",
    "Next / आगे बढ़ें": "आगे बढ़ें",
    "Select Farming Interest": "खेती के विषय चुनें",
    "Choose the farming topic you want to explore": "उस खेती के विषय को चुनें जिसे आप देखना चाहते हैं",
    "Complete Onboarding / शुरू करें": "शुरू करें",
    "Farming topic selected ✓": "खेती का विषय चयनित ✓",
    "Selected": "चयनित",
    "Show Less": "कम दिखाएं",
    "View All": "सभी देखें",
    "items": "विषय",
    "Animal Husbandry": "पशुपालन",
    "Pig Farming": "सुअर पालन",
    "Poultry Farming": "मुर्गी पालन",
    "Goat Farming": "बकरी पालन",
    "Dairy Farming": "डेयरी फार्मिंग",
    "Horticulture": "बागवानी",
    "Potato Farming": "आलू की खेती",
    "Onion Farming": "प्याज़ की खेती",
    "Mushroom Cultivation": "मशरूम की खेती",
    "Crop Science": "फसल विज्ञान",
    "Wheat Farming": "गेहूं की खेती",
    "Rice Farming": "धान की खेती",
    "Fish Farming": "मछली पालन",
  },
  te: {
    "Welcome to AgriJivan": "అగ్రిజీవన్ కు స్వాగతం",
    "Step 1 of 2 · Language Region": "దశ 1: భాష మరియు ప్రాంతం",
    "Step 2 of 2 · Farming Interests": "దశ 2: వ్యవసాయ అంశాలు",
    "Choose Your Language Region": "మీ భాషా ప్రాంతాన్ని ఎంచుకోండి",
    "Select your preferred language region to explore customized products": "అనుకూలీకరించిన ఉత్పత్తులను చూడటానికి మీ ప్రాధాನ್ಯ భాషా ప్రాంతాన్ని ఎంచుకోండి",
    "Next / आगे बढ़ें": "తరువాత",
    "Select Farming Interest": "వ్యవసాయ అంశాన్ని ఎంచుకోండి",
    "Choose the farming topic you want to explore": "మీరు చూడాలనుకుంటున్న వ్యవసాయ అంశాన్ని ఎంచుకోండి",
    "Complete Onboarding / शुरू करें": "ప్రారంభించండి",
    "Farming topic selected ✓": "వ్యవసాయ అంశం ఎంచుకోబడింది ✓",
    "Selected": "ఎంచుకోబడింది",
    "Show Less": "తక్కువ చూపించు",
    "View All": "అన్నీ చూడు",
    "items": "అంశాలు",
    "Animal Husbandry": "పశుసంవర్ధక శాఖ",
    "Pig Farming": "పందుల పెంపకం",
    "Poultry Farming": "కోళ్ళ పెంపకం",
    "Goat Farming": "మేకల పెంపకం",
    "Dairy Farming": "డైరీ ఫార్మింగ్",
    "Horticulture": "తోటపని",
    "Potato Farming": "బంగాళాదుంపల సాగు",
    "Onion Farming": "ఉల్లిపాయ సాగు",
    "Mushroom Cultivation": "మష్రూమ్ సాగు",
    "Crop Science": "పంటల విజ్ఞానం",
    "Wheat Farming": "గోధుమ సాగు",
    "Rice Farming": "వరి సాగు",
    "Fish Farming": "చేపల పెంపకం",
  }
};

export function OnboardingScreen() {
  const { setLanguage } = useLanguage();
  const { savePreferences } = useAuth();
  const insets = useSafeAreaInsets();

  // Fetch languages from DB
  const { data: remoteLanguages, isLoading: langLoading } = useLanguagesQuery();
  const languages = remoteLanguages || FALLBACK_LANGUAGES;

  // States
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch grouped categories + items directly from Supabase DB, passed with selectedLanguage
  const {
    data: catalogCategories,
    isLoading: catalogLoading,
    isError: catalogError,
    refetch: refetchCatalog,
  } = useOnboardingCatalogQuery(selectedLanguage || "en");

  // Translation helper function
  const t = (text: string): string => {
    if (!selectedLanguage) return text;
    return TRANSLATIONS[selectedLanguage]?.[text] || text;
  };

  // Sort categories: Animal Husbandry first, then rest in DB order
  const sortedCategories = React.useMemo(() => {
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
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleToggleItem = (itemId: string) => {
    if (selectedItem === itemId) {
      setSelectedItem(null);
    } else {
      setSelectedItem(itemId);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLanguage || !selectedItem) return;
    setIsSubmitting(true);
    try {
      await savePreferences(selectedLanguage, [selectedItem]);
      await setLanguage(selectedLanguage);
    } catch (err) {
      console.warn("Failed to complete onboarding:", err);
      alert("Onboarding failed, please try again.");
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Absolute backdrop so overscroll top shows green */}
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

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          {step === 2 && (
            <Pressable
              style={[styles.backBtn, { top: insets.top + 12 }]}
              onPress={() => setStep(1)}
            >
              <Ionicons name="arrow-back" size={22} color="#ffffff" />
            </Pressable>
          )}
          <Text style={styles.brandTitle}>{t("Welcome to AgriJivan")}</Text>
          <Text style={styles.brandSubtitle}>
            {step === 1
              ? t("Step 1 of 2 · Language Region")
              : t("Step 2 of 2 · Farming Interests")}
          </Text>
        </View>

        {/* White card */}
        <View style={styles.contentCard}>
          {step === 1 ? (
            /* ── STEP 1: LANGUAGE ── */
            <View style={styles.stepContainer}>
              <View>
                <Text style={styles.sectionTitle}>{t("Choose Your Language Region")}</Text>
                <Text style={styles.sectionSubtitle}>
                  {t("Select your preferred language region to explore customized products")}
                </Text>
                <View style={styles.languageGrid}>
                  {languages.map((lang) => {
                    const isSelected = selectedLanguage === lang.code;
                    return (
                      <Pressable
                        key={lang.code}
                        style={[styles.languageCard, isSelected && styles.languageCardActive]}
                        onPress={() => setSelectedLanguage(lang.code)}
                      >
                        {isSelected && (
                          <View style={styles.langCheck}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                        )}
                        <Text style={[styles.langNative, isSelected && styles.langTextActive]}>
                          {lang.nativeLabel || lang.label}
                        </Text>
                        <Text style={[styles.langEnglish, isSelected && styles.langSubActive]}>
                          {lang.label}
                        </Text>
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
                <Text style={styles.submitButtonText}>{t("Next / आगे बढ़ें")}</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </Pressable>
            </View>
          ) : (
            /* ── STEP 2: FARMING ITEMS GROUPED BY CATEGORY ── */
            <View style={styles.stepContainer}>
              <View>
                <Text style={styles.sectionTitle}>{t("Select Farming Interest")}</Text>
                <Text style={styles.sectionSubtitle}>
                  {t("Choose the farming topic you want to explore")}
                </Text>

                {/* Error state */}
                {catalogError && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
                    <Text style={styles.errorText}>Failed to load items. </Text>
                    <Pressable onPress={() => refetchCatalog()}>
                      <Text style={styles.retryText}>Tap to retry</Text>
                    </Pressable>
                  </View>
                )}

                {/* Categories from DB - Animal Husbandry first */}
                {sortedCategories.map((group: OnboardingCategory) => {
                  const isExpanded = expandedCategories.has(group.id);
                  const LIMIT = 6;
                  const visibleItems = isExpanded ? group.items : group.items.slice(0, LIMIT);
                  const hasMore = group.items.length > LIMIT;
                  const isCategorySelected = group.items.some(i => selectedItem === i.id);

                  return (
                    <View key={group.id} style={styles.categorySection}>
                      {/* Category header */}
                      <View style={styles.categoryHeaderWrap}>
                        <Text style={styles.categoryIcon}>{group.icon}</Text>
                        <Text style={styles.categoryHeading}>{t(group.name)}</Text>
                        {isCategorySelected && (
                          <Text style={styles.categoryCount}>{t("Selected")}</Text>
                        )}
                      </View>

                      {/* Item cards grid */}
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
                                <Image
                                  source={{ uri: item.image }}
                                  style={styles.itemImage}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                                  <Text style={styles.itemImagePlaceholderText}>🌱</Text>
                                </View>
                              )}
                              <Text
                                style={[styles.itemName, isSelected && styles.itemNameActive]}
                                numberOfLines={2}
                              >
                                {t(item.name)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* View All / Show Less button */}
                      {hasMore && (
                        <Pressable
                          style={styles.viewAllBtn}
                          onPress={() => toggleExpand(group.id)}
                        >
                          <Text style={styles.viewAllText}>
                            {isExpanded
                              ? t("Show Less")
                              : `${t("View All")} ${group.items.length} ${t("items")}`}
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

              {/* Bottom selection count + Submit */}
              <View>
                {selectedItem && (
                  <Text style={styles.selectionCount}>
                    {t("Farming topic selected ✓")}
                  </Text>
                )}
                <Pressable
                  style={[
                    styles.submitButton,
                    (!selectedItem || isSubmitting) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!selectedItem || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>{t("Complete Onboarding / शुरू करें")}</Text>
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
  // Category sections
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
  farmingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
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
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10b981",
  },
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
