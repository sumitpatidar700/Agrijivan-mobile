import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { colors, radius, shadow } from "@/lib/theme";
import { useLanguage } from "@/lib/language-context";
import { useActiveFarming } from "@/lib/active-farming-context";
import { t, type TranslationKey } from "@/lib/home-translations";
import { useProductsQuery } from "@/api";
import { getPriceInfo } from "@/lib/pricing";
import { useCart } from "@/lib/cart-context";
import { useCartFly } from "@/lib/cart-fly-context";
import { CartBadge } from "@/components/ui/cart-badge";
import type { Product } from "@/lib/agri-data";
import { DUMMY_BOOKS, DUMMY_EQUIPMENT, DUMMY_MEDICINE, DUMMY_FEED } from "@/lib/coming-soon-data";
import type { HomeProduct } from "@/components/home/product-section";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const LIST_PADDING = 12;
const CARD_GAP = 12;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - LIST_PADDING * 2 - CARD_GAP) / NUM_COLUMNS;

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&q=80";

const localTranslations = {
  addToCart: { hi: "कार्ट में जोड़ें", en: "Add to Cart" },
  watch: { hi: "देखें", en: "Watch" },
  search: { hi: "यहाँ खोजें...", en: "Search here..." },
  empty: { hi: "इस श्रेणी में अभी कुछ भी उपलब्ध नहीं है।", en: "Nothing available in this section yet." },
  noResults: { hi: "कोई परिणाम नहीं मिला।", en: "No matching results found." },
  results: { hi: "आइटम", en: "items" },
  sortDefault: { hi: "सभी", en: "All" },
  sortLowHigh: { hi: "कम से ज़्यादा", en: "Price: Low to High" },
  sortHighLow: { hi: "ज़्यादा से कम", en: "Price: High to Low" },
  inStock: { hi: "स्टॉक में", en: "In Stock" },
};

// Maps the `section` route param to where its data lives. Products come from the
// products table (managed in the admin Portal Builder). Sections with no productSection
// are placeholders with no data source yet. (Videos have their own dedicated tab/screen
// in the bottom nav - not routed through this generic see-all list.)
const SECTION_CONFIG: Record<
  string,
  { productSection?: string; titleKey: TranslationKey }
> = {
  books:        { productSection: "books",       titleKey: "catBooks" },
  equipment:    { productSection: "equipment",   titleKey: "catEquipment" },
  medicine:     { productSection: "medicine",    titleKey: "catMedicine" },
  feed:         { productSection: "feed",        titleKey: "catFeedSupplements" },
  training:     { productSection: "masterclass", titleKey: "catTraining" },
  farm_map:     { titleKey: "catFarmMap" },
  veterinarian: { titleKey: "catVet" },
  loan_subsidy: { titleKey: "catLoan" },
  blogs:        { titleKey: "catBlogs" },
};

type SortKey = "default" | "price_asc" | "price_desc";

// A normalized card shape so products and videos render through one renderer.
type ListItem = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  price?: number;
  mrp?: number;
  discountPct?: number;
  inStock?: boolean;
  link?: string;
  isProduct: boolean;
  comingSoon?: boolean;
};

function productToListItem(p: Product): ListItem {
  const { price, mrp, discountPct } = getPriceInfo(p.price, p.showing_price);
  return {
    id: p.id,
    title: p.title,
    subtitle: p.description || undefined,
    image: p.image || undefined,
    price: price > 0 ? price : undefined,
    mrp,
    discountPct,
    inStock: (p.stock_quantity ?? 0) > 0,
    isProduct: true,
  };
}

function dummyToListItem(p: HomeProduct): ListItem {
  return {
    id: p.id,
    title: p.name || "",
    subtitle: "Coming soon for your farming type",
    image: p.image,
    isProduct: false,
    comingSoon: true,
  };
}

// Sections that have a "Coming Soon" placeholder set to fall back to when
// there's no real data for the active farming type yet.
const DUMMY_BY_SECTION: Record<string, HomeProduct[]> = {
  books: DUMMY_BOOKS,
  equipment: DUMMY_EQUIPMENT,
  medicine: DUMMY_MEDICINE,
  feed: DUMMY_FEED,
};

export default function SeeAllScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useLanguage();
  const { activeFarming } = useActiveFarming();
  const { section, q } = useLocalSearchParams<{ section: string; q?: string }>();
  const isSearchMode = section === "search";

  const lang = locale === "hi" ? "hi" : "en";
  const tr = (key: keyof typeof localTranslations) => localTranslations[key][lang];
  const config = SECTION_CONFIG[section || "books"] ?? SECTION_CONFIG.books;
  const hasProductData = isSearchMode || !!config.productSection;

  const [search, setSearch] = useState(q || "");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [inStockOnly, setInStockOnly] = useState(false);

  const { data: dbProducts, isLoading: productsLoading } = useProductsQuery(locale || "en");
  const { addToCart, cartCount } = useCart();
  const { flyToCart } = useCartFly();

  const allItems: ListItem[] = useMemo(() => {
    if (isSearchMode) {
      // Search spans every product section for the active farming - not just one.
      return (dbProducts ?? [])
        .filter((p) => !activeFarming || (p.item_ids || []).includes(activeFarming.id))
        .map(productToListItem);
    }
    if (!config.productSection) return [];
    const real = (dbProducts ?? [])
      .filter(
        (p) =>
          p.section === config.productSection &&
          (!activeFarming || (p.item_ids || []).includes(activeFarming.id)),
      )
      .map(productToListItem);

    // No real data for this farming type yet -> show "Coming Soon" placeholders
    // (only once product data has actually finished loading, not while empty=loading).
    if (real.length === 0 && !productsLoading) {
      const dummy = DUMMY_BY_SECTION[config.productSection];
      if (dummy) return dummy.map(dummyToListItem);
    }
    return real;
  }, [config, dbProducts, activeFarming, isSearchMode, productsLoading]);

  const items = useMemo(() => {
    let result = allItems;

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.subtitle ? i.subtitle.toLowerCase().includes(q) : false),
      );
    }
    if (inStockOnly) result = result.filter((i) => i.inStock !== false);

    if (sortKey !== "default") {
      result = [...result].sort((a, b) => {
        const pa = a.price ?? 0;
        const pb = b.price ?? 0;
        return sortKey === "price_asc" ? pa - pb : pb - pa;
      });
    }
    return result;
  }, [allItems, search, sortKey, inStockOnly]);

  const isLoading = hasProductData ? productsLoading : false;
  const hasPrices = allItems.some((i) => i.price !== undefined && i.price > 0);

  const baseTitle = t(locale, config.titleKey);
  const headerTitle = isSearchMode
    ? (search.trim() ? `Results for "${search.trim()}"` : "Search Products")
    : (activeFarming ? `${activeFarming.name} ${baseTitle}` : baseTitle);

  const handlePressItem = (item: ListItem) => {
    if (item.isProduct) {
      router.push({ pathname: "/product-details", params: { id: item.id } });
    } else if (item.link) {
      Linking.openURL(item.link).catch(() => {});
    }
  };

  const handleAddToCart = async (item: ListItem, x: number, y: number) => {
    const added = await addToCart({ id: item.id, title: item.title, price: item.price ?? 0, image: item.image });
    if (added) flyToCart(x, y, item.image);
  };

  const renderFilterChip = (label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text numberOfLines={1} style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );

  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    const isPressable = item.isProduct || !!item.link;

    return (
      <View
        style={[
          styles.card,
          { width: CARD_WIDTH, marginRight: index % NUM_COLUMNS === 0 ? CARD_GAP : 0 },
          item.comingSoon && styles.cardComingSoon,
        ]}
      >
        <Pressable style={styles.cardMain} onPress={() => handlePressItem(item)} disabled={!isPressable}>
          {/* Image */}
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: item.image || FALLBACK_IMAGE }}
              style={styles.image}
              resizeMode="cover"
            />
            {item.comingSoon ? (
              <View style={[styles.discountBadge, { backgroundColor: colors.textMuted }]}>
                <Text style={styles.discountBadgeText}>COMING SOON</Text>
              </View>
            ) : (
              !!item.discountPct && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{item.discountPct}% OFF</Text>
                </View>
              )
            )}
            {!item.isProduct && item.link && (
              <View style={styles.playOverlay}>
                <Ionicons name="play-circle" size={38} color="rgba(255,255,255,0.95)" />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoCol}>
            <Text numberOfLines={2} style={styles.title}>
              {item.title}
            </Text>

            {!!item.subtitle && (
              <Text numberOfLines={1} style={styles.subtitle}>
                {item.subtitle}
              </Text>
            )}

            <View style={styles.bottomInfo}>
              {item.price !== undefined && item.price > 0 ? (
                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{item.price.toLocaleString()}</Text>
                  {!!item.mrp && (
                    <Text style={styles.originalPrice}>₹{item.mrp.toLocaleString()}</Text>
                  )}
                </View>
              ) : (
                <View style={styles.priceRow} />
              )}

              {item.isProduct && item.inStock === false && (
                <Text style={styles.outOfStock}>{lang === "hi" ? "स्टॉक ख़त्म" : "Out of stock"}</Text>
              )}
            </View>
          </View>
        </Pressable>

        {isPressable && (
          <Pressable
            style={styles.actionBtn}
            onPress={(e) =>
              item.isProduct
                ? handleAddToCart(item, e.nativeEvent.pageX, e.nativeEvent.pageY)
                : handlePressItem(item)
            }
          >
            <Ionicons
              name={item.isProduct ? "cart-outline" : "play-outline"}
              size={15}
              color="#fff"
            />
            <Text style={styles.actionBtnText}>
              {item.isProduct ? tr("addToCart") : tr("watch")}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {headerTitle}
        </Text>
        <Pressable style={styles.headerBtn} onPress={() => router.push("/cart")}>
          <Ionicons name="cart" size={24} color="#fff" />
          <CartBadge count={cartCount} />
        </Pressable>
      </View>

      <View style={styles.contentContainer}>
        {/* ── Search ────────────────────────────────────────────────────── */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder={tr("search")}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* ── Filters ───────────────────────────────────────────────────── */}
        {allItems.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {renderFilterChip(tr("sortDefault"), sortKey === "default" && !inStockOnly, () => {
              setSortKey("default");
              setInStockOnly(false);
            })}
            {hasPrices &&
              renderFilterChip(tr("sortLowHigh"), sortKey === "price_asc", () =>
                setSortKey(sortKey === "price_asc" ? "default" : "price_asc"),
              )}
            {hasPrices &&
              renderFilterChip(tr("sortHighLow"), sortKey === "price_desc", () =>
                setSortKey(sortKey === "price_desc" ? "default" : "price_desc"),
              )}
            {hasProductData &&
              renderFilterChip(tr("inStock"), inStockOnly, () => setInStockOnly(!inStockOnly))}
          </ScrollView>
        )}

        {/* ── Result count ──────────────────────────────────────────────── */}
        {!isLoading && items.length > 0 && (
          <Text style={styles.resultCount}>
            {items.length} {tr("results")}
          </Text>
        )}

        {/* ── Grid ──────────────────────────────────────────────────────── */}
        {isLoading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.stateWrap}>
            <Ionicons name="leaf-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {isSearchMode || allItems.length > 0 ? tr("noResults") : tr("empty")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.header,
  },
  header: {
    backgroundColor: colors.header,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    overflow: "hidden",
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    marginHorizontal: LIST_PADDING,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },

  // Filter chips
  chipRow: {
    paddingHorizontal: LIST_PADDING,
    gap: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  chip: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.textMuted,
  },
  chipTextActive: {
    color: "#fff",
  },

  resultCount: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: "600",
    paddingHorizontal: LIST_PADDING,
    marginBottom: 8,
  },

  // States
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 21,
  },

  // Grid
  listContent: {
    paddingHorizontal: LIST_PADDING,
    paddingBottom: 32,
  },
  card: {
    height: 286, // fixed so every card in the grid lines up exactly
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: CARD_GAP,
    overflow: "hidden",
  },
  cardComingSoon: {
    opacity: 0.75,
  },
  cardMain: {
    flex: 1,
  },
  imageWrap: {
    width: "100%",
    height: 140,
    backgroundColor: "#eef1ee",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.red,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  infoCol: {
    flex: 1, // fills the space between image and action button
    padding: 10,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 18,
    minHeight: 36, // reserve 2 lines so cards align
  },
  subtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 15,
  },
  bottomInfo: {
    marginTop: "auto", // pins price to the bottom so it aligns across the row
    paddingTop: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    minHeight: 20,
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 11.5,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  outOfStock: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.red,
    marginTop: 3,
  },

  actionBtn: {
    backgroundColor: colors.header,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    gap: 6,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "800",
  },
});
