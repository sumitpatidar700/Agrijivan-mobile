import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { colors, radius, shadow } from "@/lib/theme";
import { useLanguage } from "@/lib/language-context";
import { useProductQuery, useProductsQuery } from "@/api";
import { getPriceInfo } from "@/lib/pricing";
import { useCart } from "@/lib/cart-context";
import { useCartFly } from "@/lib/cart-fly-context";
import { CartBadge } from "@/components/ui/cart-badge";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80";

// Top card is a 2-column row: image on the left, product info on the right.
// Image column width = card inner width * 0.44 (card: 12px page margin + 12px padding).
const CARD_INNER_WIDTH = SCREEN_WIDTH - 24 - 24;
const IMAGE_COL_WIDTH = Math.round((CARD_INNER_WIDTH - 12) * 0.44);

const tx = {
  quantity: { hi: "मात्रा", en: "Quantity" },
  addToCart: { hi: "कार्ट में जोड़ें", en: "Add to Cart" },
  buyNow: { hi: "अभी खरीदें", en: "Buy Now" },
  inStock: { hi: "स्टॉक में है", en: "In Stock" },
  outOfStock: { hi: "स्टॉक ख़त्म", en: "Out of Stock" },
  youSave: { hi: "आपकी बचत", en: "You Save" },
  off: { hi: "छूट", en: "OFF" },
  about: { hi: "इसके बारे में", en: "About this Product" },
  aboutBook: { hi: "इस पुस्तक के बारे में", en: "About this Book" },
  readMore: { hi: "और पढ़ें", en: "Read More" },
  readLess: { hi: "कम पढ़ें", en: "Read Less" },
  details: { hi: "विवरण", en: "Details" },
  pages: { hi: "पृष्ठ", en: "Pages" },
  type: { hi: "प्रकार", en: "Type" },
  availability: { hi: "उपलब्धता", en: "Availability" },
  units: { hi: "इकाई", en: "units" },
  duration: { hi: "अवधि", en: "Duration" },
  alsoLike: { hi: "ये भी पसंद आ सकता है", en: "You May Also Like" },
  reviews: { hi: "समीक्षाएं", en: "Reviews" },
  customerReviews: { hi: "ग्राहक समीक्षाएं", en: "Customer Reviews" },
  verifiedPurchase: { hi: "सत्यापित खरीद", en: "Verified Purchase" },
  verifiedProduct: { hi: "सत्यापित उत्पाद", en: "Verified Product" },
  freeDelivery: { hi: "मुफ़्त डिलीवरी", en: "Free Delivery" },
  freeDeliveryDesc: { hi: "चुनिंदा ऑर्डर पर", en: "On eligible orders" },
  securePayment: { hi: "सुरक्षित भुगतान", en: "Secure Payment" },
  securePaymentDesc: { hi: "100% सुरक्षित भुगतान", en: "100% secure payments" },
  easyReturns: { hi: "आसान रिटर्न", en: "Easy Returns" },
  easyReturnsDesc: { hi: "7 दिन की रिटर्न पॉलिसी", en: "7 days return policy" },
  notFoundTitle: { hi: "उत्पाद नहीं मिला", en: "Product Not Found" },
  notFoundDesc: {
    hi: "यह उत्पाद उपलब्ध नहीं है या हटा दिया गया है।",
    en: "This product isn't available anymore or may have been removed.",
  },
  goBack: { hi: "वापस जाएं", en: "Go Back" },
};

const SECTION_LABEL: Record<string, { hi: string; en: string }> = {
  books: { hi: "कृषि पुस्तक", en: "Agriculture Book" },
  equipment: { hi: "कृषि उपकरण", en: "Farm Equipment" },
  medicine: { hi: "पशु दवाई", en: "Livestock Medicine" },
  feed: { hi: "फीड सप्लीमेंट", en: "Feed Supplement" },
  fertilizers: { hi: "उर्वरक", en: "Fertilizer" },
  seeds: { hi: "बीज", en: "Seeds" },
  masterclass: { hi: "प्रशिक्षण कोर्स", en: "Training Course" },
};

// ─── PLACEHOLDER REVIEW DATA ─────────────────────────────────────────────────
// NOT REAL DATA. These values are static and render identically for every product.
// TODO: replace with a real `product_reviews` table (product_id, user_id, rating,
// comment, verified_purchase, created_at) and swap this constant for a query.
// Set SHOW_PLACEHOLDER_REVIEWS to false to hide the whole reviews UI.
const SHOW_PLACEHOLDER_REVIEWS = true;
const PLACEHOLDER_REVIEWS = {
  average: 4.8,
  total: 256,
  // % of reviews at each star level, 5 -> 1
  histogram: [80, 15, 4, 1, 0],
  sample: {
    rating: 5,
    author: "Rajesh Kumar",
    text: {
      hi: "बहुत उपयोगी पुस्तक। सभी विषय सरल भाषा में व्यावहारिक उदाहरणों के साथ समझाए गए हैं।",
      en: "Very useful book. All topics are explained in simple language with practical examples.",
    },
  },
};

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={rating >= i ? "star" : rating >= i - 0.5 ? "star-half" : "star-outline"}
          size={size}
          color={colors.warning}
        />
      ))}
    </View>
  );
}

export default function ProductDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();

  const lang = locale === "hi" ? "hi" : "en";
  const tr = (key: keyof typeof tx) => tx[key][lang];

  const { data: product, isLoading, isError } = useProductQuery(id, locale || "en");
  const { data: allProducts } = useProductsQuery(locale || "en");
  const { addToCart, cartCount } = useCart();
  const { flyToCart } = useCartFly();

  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const galleryRef = useRef<ScrollView>(null);

  // Main image + any gallery images the admin uploaded
  const images: string[] = useMemo(() => {
    if (!product) return [];
    const gallery = Array.isArray((product as any).gallery_images)
      ? ((product as any).gallery_images as string[])
      : [];
    return [product.image, ...gallery].filter(Boolean) as string[];
  }, [product]);

  const related = useMemo(() => {
    if (!product || !allProducts) return [];
    return allProducts.filter((p) => p.section === product.section && p.id !== product.id).slice(0, 8);
  }, [allProducts, product]);

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={[styles.screen, styles.centered, { paddingHorizontal: 32 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.notFoundTitle}>{tr("notFoundTitle")}</Text>
        <Text style={styles.notFoundDesc}>{tr("notFoundDesc")}</Text>
        <Pressable style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackBtnText}>{tr("goBack")}</Text>
        </Pressable>
      </View>
    );
  }

  const { price, mrp, discountPct } = getPriceInfo(product.price, product.showing_price);
  const savings = mrp ? mrp - price : 0;
  const inStock = (product.stock_quantity ?? 0) > 0;
  const isBook = product.section === "books";
  const sectionLabel = product.section ? SECTION_LABEL[product.section]?.[lang] : undefined;

  const aboutText = (product as any).about_book || product.description || "";
  const pages = (product as any).pages;
  const duration = (product as any).duration;

  const heroImage = images[activeImage] || FALLBACK_IMAGE;

  const handleImageScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / IMAGE_COL_WIDTH);
    if (idx !== activeImage) setActiveImage(idx);
  };

  const selectImage = (idx: number) => {
    setActiveImage(idx);
    galleryRef.current?.scrollTo({ x: idx * IMAGE_COL_WIDTH, animated: true });
  };

  const handleAddToCart = async (x: number, y: number) => {
    setAddingToCart(true);
    const added = await addToCart(
      { id: product.id, title: product.title, price, image: product.image || undefined },
      qty,
    );
    setAddingToCart(false);
    if (added) flyToCart(x, y, product.image || undefined);
  };

  const detailRows = [
    isBook && pages ? { icon: "document-text-outline" as const, label: tr("pages"), value: String(pages) } : null,
    duration ? { icon: "time-outline" as const, label: tr("duration"), value: String(duration) } : null,
    sectionLabel ? { icon: "pricetag-outline" as const, label: tr("type"), value: sectionLabel } : null,
    {
      icon: "cube-outline" as const,
      label: tr("availability"),
      value: inStock ? `${product.stock_quantity} ${tr("units")}` : tr("outOfStock"),
    },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  const trustBadges = [
    { icon: "car-outline" as const, title: tr("freeDelivery"), desc: tr("freeDeliveryDesc") },
    { icon: "shield-checkmark-outline" as const, title: tr("securePayment"), desc: tr("securePaymentDesc") },
    { icon: "refresh-outline" as const, title: tr("easyReturns"), desc: tr("easyReturnsDesc") },
  ];

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {product.title}
        </Text>
        <Pressable style={styles.headerBtn} onPress={() => router.push("/cart")}>
          <Ionicons name="cart" size={22} color="#fff" />
          <CartBadge count={cartCount} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        {/* ── Image (left) + product info (right) ───────────────── */}
        <View style={[styles.card, styles.topRow]}>
          {/* Left column: gallery + thumbnails */}
          <View style={styles.imageCol}>
            <View style={styles.galleryWrap}>
              <ScrollView
                ref={galleryRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleImageScroll}
              >
                {(images.length ? images : [FALLBACK_IMAGE]).map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.heroImage} resizeMode="cover" />
                ))}
              </ScrollView>

              {images.length > 1 && (
                <View style={styles.dotsRow}>
                  {images.map((_, i) => (
                    <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
                  ))}
                </View>
              )}
            </View>

            {images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRow}
              >
                {images.map((uri, i) => (
                  <Pressable key={i} onPress={() => selectImage(i)}>
                    <Image
                      source={{ uri }}
                      style={[styles.thumb, i === activeImage && styles.thumbActive]}
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Right column: title, rating, price, stock */}
          <View style={styles.infoCol}>
            {sectionLabel && <Text style={styles.eyebrow}>{sectionLabel}</Text>}
            <Text style={styles.title}>{product.title}</Text>

            {SHOW_PLACEHOLDER_REVIEWS && (
              <View style={styles.ratingRow}>
                <StarRow rating={PLACEHOLDER_REVIEWS.average} size={13} />
                <Text style={styles.ratingValue}>{PLACEHOLDER_REVIEWS.average}</Text>
              </View>
            )}

            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primaryLight} />
              <Text style={styles.verifiedText}>{tr("verifiedProduct")}</Text>
            </View>

            {price > 0 && (
              <View style={styles.priceCol}>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{price.toLocaleString()}</Text>
                  {!!discountPct && (
                    <Text style={styles.discount}>
                      {discountPct}% {tr("off")}
                    </Text>
                  )}
                </View>
                {!!mrp && <Text style={styles.mrp}>₹{mrp.toLocaleString()}</Text>}
              </View>
            )}

            <View style={styles.stockRow}>
              <View style={[styles.stockDot, { backgroundColor: inStock ? colors.primaryLight : colors.red }]} />
              <Text style={[styles.stockText, { color: inStock ? colors.primary : colors.red }]}>
                {inStock ? tr("inStock") : tr("outOfStock")}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Trust badges ──────────────────────────────────────── */}
        <View style={styles.card}>
          {trustBadges.map((b, i) => (
            <View
              key={b.title}
              style={[styles.trustRow, i < trustBadges.length - 1 && styles.trustDivider]}
            >
              <View style={styles.trustIcon}>
                <Ionicons name={b.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trustTitle}>{b.title}</Text>
                <Text style={styles.trustDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Quantity ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>{tr("quantity")}</Text>
            <View style={styles.qtyRow}>
              <Pressable style={styles.qtyBtn} onPress={() => qty > 1 && setQty(qty - 1)}>
                <Ionicons name="remove" size={18} color={qty > 1 ? colors.text : colors.tabInactive} />
              </Pressable>
              <Text style={styles.qtyText}>{qty}</Text>
              <Pressable style={styles.qtyBtn} onPress={() => setQty(qty + 1)}>
                <Ionicons name="add" size={18} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── About ─────────────────────────────────────────────── */}
        {!!aboutText && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{isBook ? tr("aboutBook") : tr("about")}</Text>
            <Text style={styles.bodyText} numberOfLines={expanded ? undefined : 4}>
              {aboutText}
            </Text>
            {aboutText.length > 180 && (
              <Pressable style={styles.readMoreBtn} onPress={() => setExpanded(!expanded)}>
                <Text style={styles.readMoreText}>{expanded ? tr("readLess") : tr("readMore")}</Text>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={colors.primary}
                />
              </Pressable>
            )}
          </View>
        )}

        {/* ── Details grid ──────────────────────────────────────── */}
        {detailRows.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{tr("details")}</Text>
            <View style={styles.detailGrid}>
              {detailRows.map((d) => (
                <View key={d.label} style={styles.detailCell}>
                  <View style={styles.detailIcon}>
                    <Ionicons name={d.icon} size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{d.label}</Text>
                    <Text numberOfLines={2} style={styles.detailValue}>
                      {d.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Customer reviews (placeholder data - see PLACEHOLDER_REVIEWS) ── */}
        {SHOW_PLACEHOLDER_REVIEWS && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{tr("customerReviews")}</Text>

            <View style={styles.reviewSummary}>
              {/* Average */}
              <View style={styles.reviewAvgCol}>
                <Text style={styles.reviewAvg}>{PLACEHOLDER_REVIEWS.average}</Text>
                <StarRow rating={PLACEHOLDER_REVIEWS.average} size={14} />
                <Text style={styles.reviewCount}>
                  {PLACEHOLDER_REVIEWS.total} {tr("reviews")}
                </Text>
              </View>

              {/* Histogram */}
              <View style={styles.histogramCol}>
                {PLACEHOLDER_REVIEWS.histogram.map((pct, idx) => {
                  const star = 5 - idx;
                  return (
                    <View key={star} style={styles.histRow}>
                      <Text style={styles.histStar}>{star}</Text>
                      <Ionicons name="star" size={10} color={colors.warning} />
                      <View style={styles.histTrack}>
                        <View style={[styles.histFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.histPct}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Sample review */}
            <View style={styles.reviewCard}>
              <StarRow rating={PLACEHOLDER_REVIEWS.sample.rating} size={13} />
              <Text style={styles.reviewText}>{PLACEHOLDER_REVIEWS.sample.text[lang]}</Text>
              <View style={styles.reviewAuthorRow}>
                <Text style={styles.reviewAuthor}>{PLACEHOLDER_REVIEWS.sample.author}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>{tr("verifiedPurchase")}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── You may also like ─────────────────────────────────── */}
        {related.length > 0 && (
          <View style={[styles.card, { paddingRight: 0 }]}>
            <Text style={styles.sectionTitle}>{tr("alsoLike")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 16, paddingTop: 4 }}
            >
              {related.map((p) => {
                const rp = getPriceInfo(p.price, p.showing_price);
                return (
                  <Pressable
                    key={p.id}
                    style={styles.relCard}
                    onPress={() =>
                      router.push({ pathname: "/product-details", params: { id: p.id } })
                    }
                  >
                    <Image
                      source={{ uri: p.image || FALLBACK_IMAGE }}
                      style={styles.relImage}
                      resizeMode="cover"
                    />
                    <View style={styles.relInfo}>
                      <Text numberOfLines={2} style={styles.relTitle}>
                        {p.title}
                      </Text>
                      <View style={styles.relPriceRow}>
                        <Text style={styles.relPrice}>₹{rp.price.toLocaleString()}</Text>
                        {!!rp.discountPct && (
                          <Text style={styles.relDiscount}>{rp.discountPct}%</Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ── Sticky purchase bar ───────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 12 }]}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceText}>₹{price.toLocaleString()}</Text>
          {savings > 0 && (
            <Text style={styles.bottomSave}>
              {tr("youSave")} ₹{savings.toLocaleString()}
            </Text>
          )}
        </View>

        <Pressable
          style={[styles.cartBtn, !inStock && styles.btnDisabled]}
          onPress={(e) => handleAddToCart(e.nativeEvent.pageX, e.nativeEvent.pageY)}
          disabled={addingToCart || !inStock}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="cart-outline" size={17} color={colors.primary} />
              <Text style={styles.cartBtnText}>{tr("addToCart")}</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.buyBtn, !inStock && styles.btnDisabled]}
          onPress={() => router.push("/cart")}
          disabled={!inStock}
        >
          <Ionicons name="flash" size={16} color="#fff" />
          <Text style={styles.buyBtnText}>{tr("buyNow")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: "center", justifyContent: "center", gap: 10 },

  notFoundTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginTop: 6 },
  notFoundDesc: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 20 },
  goBackBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  goBackBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  header: {
    backgroundColor: colors.header,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", position: "relative" },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 4,
  },

  // Top row: image column + info column
  topRow: { flexDirection: "row", gap: 12, padding: 12, alignItems: "flex-start" },
  imageCol: { width: IMAGE_COL_WIDTH },
  infoCol: { flex: 1, minWidth: 0 },

  // Gallery
  galleryWrap: {
    width: IMAGE_COL_WIDTH,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: "#eef1ee",
    position: "relative",
  },
  heroImage: { width: IMAGE_COL_WIDTH, height: 200, backgroundColor: "#eef1ee" },
  dotsRow: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.6)" },
  dotActive: { width: 14, backgroundColor: "#fff" },

  thumbRow: { gap: 8, paddingTop: 8 },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#eef1ee",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: { borderColor: colors.primary },

  // Generic card
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  title: { fontSize: 17, fontWeight: "800", color: colors.text, lineHeight: 23 },

  priceCol: { marginTop: 10 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  price: { fontSize: 22, fontWeight: "800", color: colors.primary },
  mrp: { fontSize: 13, color: colors.textMuted, textDecorationLine: "line-through", marginTop: 1 },
  discount: { fontSize: 13, fontWeight: "800", color: colors.red },

  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  ratingValue: { fontSize: 13.5, fontWeight: "800", color: colors.text },

  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  verifiedText: { fontSize: 12.5, fontWeight: "700", color: colors.primary },

  // Reviews
  reviewSummary: { flexDirection: "row", gap: 16, alignItems: "center" },
  reviewAvgCol: { alignItems: "center", gap: 4, width: 88 },
  reviewAvg: { fontSize: 34, fontWeight: "800", color: colors.text, lineHeight: 40 },
  reviewCount: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  histogramCol: { flex: 1, gap: 5 },
  histRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  histStar: { fontSize: 11, color: colors.textMuted, fontWeight: "700", width: 8 },
  histTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  histFill: { height: "100%", borderRadius: 3, backgroundColor: colors.primary },
  histPct: { fontSize: 10.5, color: colors.textMuted, fontWeight: "600", width: 30, textAlign: "right" },
  reviewCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 7,
  },
  reviewText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  reviewAuthorRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  reviewAuthor: { fontSize: 12.5, fontWeight: "700", color: colors.text },
  verifiedBadge: {
    backgroundColor: "rgba(5,81,3,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: { fontSize: 10, fontWeight: "700", color: colors.primary },

  stockRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 13, fontWeight: "700" },

  // Trust badges
  trustRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  trustDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  trustIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(5,81,3,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  trustTitle: { fontSize: 13.5, fontWeight: "700", color: colors.text },
  trustDesc: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },

  // Options
  optionRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  optionLabel: { fontSize: 13.5, fontWeight: "700", color: colors.text, width: 74 },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  qtyBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 15, fontWeight: "800", color: colors.text, paddingHorizontal: 14 },

  // Sections
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 10 },
  bodyText: { fontSize: 13.5, color: colors.textMuted, lineHeight: 21 },
  readMoreBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, alignSelf: "flex-end" },
  readMoreText: { fontSize: 13, fontWeight: "800", color: colors.primary },

  // Details
  detailGrid: { flexDirection: "row", flexWrap: "wrap" },
  detailCell: {
    width: "50%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingVertical: 10,
    paddingRight: 8,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(5,81,3,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  detailValue: { fontSize: 13, color: colors.text, fontWeight: "700", marginTop: 2 },

  // Related
  relCard: {
    width: 132,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  relImage: { width: "100%", height: 100, backgroundColor: "#eef1ee" },
  relInfo: { padding: 8 },
  relTitle: { fontSize: 12, fontWeight: "700", color: colors.text, lineHeight: 16, minHeight: 32 },
  relPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 5 },
  relPrice: { fontSize: 14, fontWeight: "800", color: colors.primary },
  relDiscount: { fontSize: 11, fontWeight: "800", color: colors.red },

  // Sticky bar
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow,
  },
  bottomPrice: { minWidth: 74 },
  bottomPriceText: { fontSize: 18, fontWeight: "800", color: colors.primary },
  bottomSave: { fontSize: 10.5, color: colors.textMuted, fontWeight: "600", marginTop: 1 },
  cartBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cartBtnText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  buyBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  buyBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  btnDisabled: { opacity: 0.5 },
});
