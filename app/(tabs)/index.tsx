import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useLanguagesQuery, useProductsQuery } from "@/api";
import { useHubCategoriesQuery, useHubCategorySectionsQuery, matchHubCategoryKey } from "@/api/hub";
import { getPriceInfo } from "@/lib/pricing";
import { useCart } from "@/lib/cart-context";
import { useCartFly } from "@/lib/cart-fly-context";
import { GreenHeader } from "@/components/home/green-header";
import { CategoryGrid } from "@/components/home/category-grid";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { ProductSection, HomeProduct } from "@/components/home/product-section";
import { ProductSectionSkeleton } from "@/components/ui/skeleton";
import { StatsBar } from "@/components/home/stats-bar";
import { CommunityImpactSection } from "@/components/home/community-impact";
import { TrainingProgramsSection } from "@/components/home/training-programs";
import { clearWeatherCache } from "@/components/home/weather-card";
import { colors, radius, shadow } from "@/lib/theme";
import { useLanguage } from "@/lib/language-context";
import { useActiveFarming } from "@/lib/active-farming-context";
import { t } from "@/lib/home-translations";
import type { Product } from "@/lib/agri-data";
import { DUMMY_BOOKS, DUMMY_EQUIPMENT, DUMMY_MEDICINE, DUMMY_FEED } from "@/lib/coming-soon-data";


// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { isError, error, refetch } = useLanguagesQuery();
  const { locale, setLanguage } = useLanguage();
  const { data: dbProducts, isLoading: productsLoading } = useProductsQuery(locale || "en");
  const { activeFarming, isLoading: farmingLoading } = useActiveFarming();
  const { cartCount, addToCart } = useCart();
  const { flyToCart } = useCartFly();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    clearWeatherCache();
    try {
      await refetch();
    } catch (err) {
      console.warn("Home screen refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch (err) {
      console.error("Error opening URL:", err);
    }
  };

  const handleAddToCart = async (product: HomeProduct, x: number, y: number) => {
    const added = await addToCart({
      id: product.id,
      title: product.name || "",
      price: product.price,
      image: product.image,
    });
    if (added) flyToCart(x, y, product.image);
  };

  const mapToHomeProduct = (p: Product, fallbackImage: string, index = 0): HomeProduct => {
    const { price, mrp } = getPriceInfo(p.price, p.showing_price);
    const hasValidMrp = mrp && mrp > price;
    const computedMrp = hasValidMrp ? mrp : Math.round(price * 1.35);
    const badges = ["badgeBestseller", "badgeFeatured", "badgeBestseller", "badgeFeatured"];
    const dummyRatings = [4.8, 4.7, 4.9, 4.6];
    const dummyReviews = [156, 89, 234, 112];

    return {
      id: p.id,
      name: p.title,
      image: p.image || fallbackImage,
      rating: dummyRatings[index % dummyRatings.length],
      reviewCount: dummyReviews[index % dummyReviews.length],
      price,
      originalPrice: computedMrp,
      badgeKey: badges[index % badges.length],
    } as HomeProduct;
  };

  const activeBooks = dbProducts
    ? dbProducts
        .filter((p) => p.section === "books" && (!activeFarming || (p.item_ids || []).includes(activeFarming.id)))
        .slice(0, 4)
        .map((p, idx) => mapToHomeProduct(p, "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80", idx))
    : [];

  const activeEquipment = dbProducts
    ? dbProducts
        .filter((p) => p.section === "equipment" && (!activeFarming || (p.item_ids || []).includes(activeFarming.id)))
        .slice(0, 4)
        .map((p, idx) => mapToHomeProduct(p, "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&q=80", idx))
    : [];

  // No real products for this farming type yet -> show clearly-labeled "Coming
  // Soon" placeholders instead of hiding the section entirely.
  const displayBooks = activeBooks.length > 0 ? activeBooks : DUMMY_BOOKS;
  const displayEquipment = activeEquipment.length > 0 ? activeEquipment : DUMMY_EQUIPMENT;
  const booksTitleOverride = activeFarming ? `${activeFarming.name} Books` : undefined;
  const equipmentTitleOverride = activeFarming ? `${activeFarming.name} Equipment` : undefined;

  // ── Medicine / Feed Supplements: gated by Category Hub, dummy fallback otherwise ──
  const hubMatchedCategoryKey = matchHubCategoryKey(activeFarming?.categorySlug);
  const { data: hubCategories } = useHubCategoriesQuery();
  const matchedHubCategory = hubCategories?.find((c) => c.key === hubMatchedCategoryKey) ?? null;
  const { data: hubSections } = useHubCategorySectionsQuery(matchedHubCategory?.id ?? null);

  const isHubSectionVisible = (hubKey: string) => {
    if (!matchedHubCategory || !hubSections) return true; // no confident match yet -> don't hide
    return hubSections.find((s) => s.key === hubKey)?.enabled ?? false;
  };

  const activeMedicine = dbProducts
    ? dbProducts
        .filter((p) => p.section === "medicine" && (!activeFarming || (p.item_ids || []).includes(activeFarming.id)))
        .slice(0, 4)
        .map((p) => mapToHomeProduct(p, "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80"))
    : [];

  const activeFeed = dbProducts
    ? dbProducts
        .filter((p) => p.section === "feed" && (!activeFarming || (p.item_ids || []).includes(activeFarming.id)))
        .slice(0, 4)
        .map((p) => mapToHomeProduct(p, "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=300&q=80"))
    : [];

  const displayMedicine = activeMedicine.length > 0 ? activeMedicine : DUMMY_MEDICINE;
  const displayFeed = activeFeed.length > 0 ? activeFeed : DUMMY_FEED;

  const medicineTitleOverride = activeFarming ? `${activeFarming.name} Medicine` : undefined;
  const feedTitleOverride = activeFarming ? `${activeFarming.name} Feed Supplements` : undefined;

  // While products (or the active farming they're filtered by) are still loading we
  // render skeletons rather than placeholder products, so nothing fake is ever shown.
  const sectionsLoading = productsLoading || farmingLoading;

  // The Category Hub visibility toggle only hides a section when there's REAL
  // data being hidden by it - a "Coming Soon" placeholder should always show,
  // regardless of that per-category admin toggle.
  const showBooks = activeBooks.length > 0 ? isHubSectionVisible("books") : true;
  const showEquipment = activeEquipment.length > 0 ? isHubSectionVisible("equipment") : true;
  const showMedicine = activeMedicine.length > 0 ? isHubSectionVisible("medicine") : true;
  const showFeed = activeFeed.length > 0 ? isHubSectionVisible("feed_supplements") : true;

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.header }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── 1. Header ─────────────────────────────────────── */}
        <GreenHeader
          locale={locale}
          onLanguagePress={() => setLanguage(null)}
          onSearchSubmit={(text) =>
            router.push({ pathname: "/see-all", params: { section: "search", q: text } })
          }
          onCartPress={() => router.push("/cart")}
          onWishlistPress={() => {}}
          onCameraPress={() => {}}
          cartCount={cartCount}
        />

        {/* White page overlay with rounded top corners */}
        <View style={styles.contentContainer}>
          {/* ── 2. Category Grid ─────────────────────────────────*/}
          <CategoryGrid
            locale={locale}
            onCategoryPress={(section) =>
              section === "videos"
                ? router.push("/(tabs)/farming")
                : router.push({ pathname: "/see-all", params: { section } })
            }
            isSectionVisible={isHubSectionVisible}
          />

        {/* ── 3. Banner Carousel ───────────────────────────────*/}
        <BannerCarousel
          locale={locale}
          onCtaPress={() => router.push("/products")}
        />

        {/* ── Product sections: skeletons while loading, nothing if empty ──*/}
        {sectionsLoading && (
          <>
            <ProductSectionSkeleton />
            <ProductSectionSkeleton />
          </>
        )}

        {/* ── 4. Books Section ─────────────────────────────────*/}
        {!sectionsLoading && showBooks && (
          <ProductSection
            locale={locale}
            title={booksTitleOverride}
            titleKey={booksTitleOverride ? undefined : "booksTitle"}
            subtitleKey="booksSubtitle"
            icon="📚"
            products={displayBooks}
            onSeeAll={() =>
              router.push({ pathname: "/see-all", params: { section: "books" } })
            }
            onAddToCart={handleAddToCart}
          />
        )}

        {/* ── YouTube Subscribe Banner ───────────────────────────*/}
        <View style={styles.ytSection}>
          <Pressable
            style={styles.ytCard}
            onPress={() =>
              handleOpenLink("https://www.youtube.com/@Agrijivanfarming")
            }
          >
            <View style={styles.ytLeft}>
              <View style={styles.ytLogoWrap}>
                <Ionicons name="logo-youtube" size={26} color={colors.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ytTitle}>{t(locale, "ytTitle")}</Text>
                <Text style={styles.ytSubtitle}>{t(locale, "ytSubtitle")}</Text>
              </View>
            </View>
            <View style={styles.ytSubscribeBtn}>
              <Text style={styles.ytSubscribeBtnText}>
                {t(locale, "ytSubscribe")}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ── 5. Equipment Section ─────────────────────────────*/}
        {!sectionsLoading && showEquipment && (
          <ProductSection
            locale={locale}
            title={equipmentTitleOverride}
            titleKey={equipmentTitleOverride ? undefined : "equipmentTitle"}
            subtitleKey="equipmentSubtitle"
            icon="🔧"
            products={displayEquipment}
            onSeeAll={() =>
              router.push({ pathname: "/see-all", params: { section: "equipment" } })
            }
            onAddToCart={handleAddToCart}
          />
        )}

        {/* ── Expert Training Programs (hardcoded) ─────────────*/}
        <TrainingProgramsSection />

        {/* ── Medicine Section (Category Hub gated) ─────────────*/}
        {!sectionsLoading && showMedicine && (
          <ProductSection
            locale={locale}
            title={medicineTitleOverride}
            titleKey={medicineTitleOverride ? undefined : "medicineTitle"}
            subtitleKey="medicineSubtitle"
            icon="💊"
            products={displayMedicine}
            onSeeAll={() =>
              router.push({ pathname: "/see-all", params: { section: "medicine" } })
            }
            onAddToCart={handleAddToCart}
          />
        )}

        {/* ── Stats Bar (Happy Farmers / Products / 24/7 Support) ─*/}
        <StatsBar locale={locale} />

        {/* ── Feed Supplements Section (Category Hub gated) ─────*/}
        {!sectionsLoading && showFeed && (
          <ProductSection
            locale={locale}
            title={feedTitleOverride}
            titleKey={feedTitleOverride ? undefined : "feedTitle"}
            subtitleKey="feedSubtitle"
            icon="🌾"
            products={displayFeed}
            onSeeAll={() =>
              router.push({ pathname: "/see-all", params: { section: "feed" } })
            }
            onAddToCart={handleAddToCart}
          />
        )}

        {/* ── Community Impact: social stats + gallery (hardcoded) ─*/}
        <CommunityImpactSection />

        {/* ── Error ────────────────────────────────────────────*/}
        {isError && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error.message}</Text>
          </View>
        )}
        </View>
      </ScrollView>

      {/* Floating Call & WhatsApp Buttons */}
      <View style={styles.fabContainer}>
        <Pressable
          style={styles.fabBtn}
          onPress={() => handleOpenLink("https://wa.me/919000000000")}
        >
          <Ionicons name="logo-whatsapp" size={26} color="#fff" />
        </Pressable>
        <Pressable
          style={[styles.fabBtn, { backgroundColor: "#2e7d32" }]}
          onPress={() => handleOpenLink("tel:+919000000000")}
        >
          <Ionicons name="call" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    overflow: "hidden",
    marginTop: 0,
  },
  // YouTube
  ytSection: {
    paddingHorizontal: 14,
    marginTop: 12,
  },
  ytCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  ytLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  ytLogoWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffebee",
    justifyContent: "center",
    alignItems: "center",
  },
  ytTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  ytSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },
  ytSubscribeBtn: {
    backgroundColor: colors.red,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  ytSubscribeBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  // Loader / Error
  errorWrap: { paddingHorizontal: 20, paddingVertical: 16 },
  errorText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  fabContainer: {
    position: "absolute",
    bottom: 20,
    right: 16,
    gap: 10,
    alignItems: "center",
    zIndex: 999,
  },
  fabBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#25D366", // WhatsApp brand color
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
    elevation: 8,
  },
});
