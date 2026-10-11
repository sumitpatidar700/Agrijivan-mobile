import React from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, radius, shadow } from "@/lib/theme";
import { t } from "@/lib/home-translations";

import { useRouter } from "expo-router";

export type HomeProduct = {
  id: string;
  nameKey?: string;
  name?: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice: number;
  badgeKey?: string;
  comingSoon?: boolean;
};

const badgeColors: Record<string, string> = {
  badgeBestseller: "#D32F2F", // Vibrant red for bestseller
  badgeFeatured: "#1976D2",   // Vibrant blue for featured
  badgeNew: "#2E7D32",        // Clean green for new
};

type ProductSectionProps = {
  locale: string | null;
  titleKey?: string;
  title?: string;
  subtitleKey?: string;
  subtitle?: string;
  icon?: string;
  products: HomeProduct[];
  onSeeAll?: () => void;
  onAddToCart?: (product: HomeProduct, x: number, y: number) => void;
};

export function ProductSection({
  locale,
  titleKey,
  title,
  subtitleKey,
  subtitle,
  icon,
  products,
  onSeeAll,
  onAddToCart,
}: ProductSectionProps) {
  const router = useRouter();

  return (
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {icon ? <Text style={styles.headerIcon}>{icon}</Text> : null}
          <View>
            <Text style={styles.sectionTitle}>{title || (titleKey ? t(locale, titleKey as any) : "")}</Text>
            <Text style={styles.sectionSubtitle}>{subtitle || (subtitleKey ? t(locale, subtitleKey as any) : "")}</Text>
          </View>
        </View>
        <Pressable style={styles.seeAllBtn} onPress={onSeeAll}>
          <Text style={styles.seeAllText}>{t(locale, "seeAll")}</Text>
        </Pressable>
      </View>

      {/* Horizontal product scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((product) => {
          const hasMarkdown = product.originalPrice > product.price;
          const discountPct = hasMarkdown
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0;
          const badgeColor = product.badgeKey
            ? badgeColors[product.badgeKey] ?? "#D32F2F"
            : undefined;

          return (
            <View key={product.id} style={[styles.card, product.comingSoon && styles.cardComingSoon]}>
              {/* Pressable to go to Details */}
              <Pressable
                style={styles.cardPressable}
                onPress={() =>
                  product.comingSoon
                    ? Alert.alert("Coming Soon", "This item isn't available yet - check back soon!")
                    : router.push({ pathname: "/product-details", params: { id: product.id } })
                }
              >
                {/* Image */}
                <View style={styles.imageWrap}>
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                  {product.comingSoon ? (
                    <View style={[styles.badge, { backgroundColor: colors.textMuted }]}>
                      <Text style={styles.badgeText}>COMING SOON</Text>
                    </View>
                  ) : (
                    product.badgeKey && (
                      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                        <Text style={styles.badgeText}>
                          {t(locale, product.badgeKey as any)}
                        </Text>
                      </View>
                    )
                  )}
                </View>

                {/* Info */}
                <View style={styles.info}>
                  <Text numberOfLines={2} style={styles.productName}>
                    {product.name || (product.nameKey ? t(locale, product.nameKey as any) : "")}
                  </Text>

                  {!product.comingSoon && (
                    <>
                      {/* Stars */}
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={11} color="#FFA000" />
                        <Text style={styles.ratingText}>{product.rating ? product.rating.toFixed(1) : "4.8"}</Text>
                        <Text style={styles.reviewText}>({product.reviewCount ?? 156})</Text>
                      </View>

                      {/* Price in one single row */}
                      <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{product.price.toLocaleString()}</Text>
                        {hasMarkdown && (
                          <>
                            <Text style={styles.originalPrice}>
                              ₹{product.originalPrice.toLocaleString()}
                            </Text>
                            <Text style={styles.discountText}>{discountPct}% OFF</Text>
                          </>
                        )}
                      </View>
                    </>
                  )}
                  {product.comingSoon && (
                    <Text style={styles.comingSoonText}>Launching soon for your farming type</Text>
                  )}
                </View>
              </Pressable>

              {/* Add to Cart */}
              <View style={styles.btnWrap}>
                <Pressable
                  style={[styles.addBtn, product.comingSoon && styles.addBtnDisabled]}
                  onPress={(e) =>
                    product.comingSoon
                      ? Alert.alert("Coming Soon", "This item isn't available yet - check back soon!")
                      : onAddToCart?.(product, e.nativeEvent.pageX, e.nativeEvent.pageY)
                  }
                >
                  <Text style={[styles.addBtnText, product.comingSoon && { color: colors.textMuted }]}>
                    {product.comingSoon ? "Notify Me" : t(locale, "addToCart")}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    backgroundColor: "#fff",
    paddingVertical: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  headerIcon: { fontSize: 20 },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  seeAllBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  seeAllText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 14,
    gap: 10,
    paddingBottom: 2,
  },
  card: {
    width: 145,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingBottom: 8,
    ...shadow,
    elevation: 2,
  },
  cardComingSoon: {
    opacity: 0.75,
  },
  cardPressable: {
    flexDirection: "column",
  },
  imageWrap: {
    height: 105, // Compact image container
    backgroundColor: "#fff",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  productImage: { width: "100%", height: "100%" },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  badgeText: { color: "#fff", fontSize: 8.5, fontWeight: "800" },
  info: { 
    paddingHorizontal: 8, 
    paddingTop: 4,
    paddingBottom: 2,
  },
  productName: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 15,
    height: 30, // 2 lines fixed
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  ratingText: { fontSize: 10.5, fontWeight: "700", color: "#374151" },
  reviewText: { fontSize: 9.5, color: "#9CA3AF" },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 4,
    marginTop: 3,
  },
  price: { fontSize: 13.5, fontWeight: "800", color: "#166534" },
  originalPrice: {
    fontSize: 10.5,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  discountText: { fontSize: 10.5, fontWeight: "800", color: "#DC2626" },
  btnWrap: {
    paddingHorizontal: 8,
    marginTop: 6,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#2E7D32", // Light green border
    backgroundColor: "#F7FCF8", // Soft light green background
    borderRadius: 8,
    paddingVertical: 5,
  },
  addBtnText: { fontSize: 11, fontWeight: "700", color: "#2E7D32" },
  addBtnDisabled: { borderColor: colors.textMuted },
  comingSoonText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 1,
  },
});
