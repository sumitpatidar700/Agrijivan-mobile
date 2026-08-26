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
  badgeBestseller: "#e53935",
  badgeFeatured: "#1565c0",
  badgeNew: "#2e7d32",
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
          // Only treat it as a markdown when there's a real MRP above the selling
          // price - otherwise we'd render "₹0" and a nonsense discount.
          const hasMarkdown = product.originalPrice > product.price;
          const discountPct = hasMarkdown
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0;
          const badgeColor = product.badgeKey
            ? badgeColors[product.badgeKey] ?? colors.primary
            : undefined;

          return (
            <View key={product.id} style={[styles.card, product.comingSoon && styles.cardComingSoon]}>
              {/* Pressable to go to Details */}
              <Pressable
                style={{ flex: 1, flexDirection: "column" }}
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
                    resizeMode="cover"
                  />
                  {product.comingSoon ? (
                    <View style={[styles.badge, { backgroundColor: colors.textMuted }]}>
                      <Text style={styles.badgeText}>COMING SOON</Text>
                    </View>
                  ) : (
                    product.badgeKey && (
                      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                        <Text style={styles.badgeText}>
                          {t(locale, product.badgeKey)}
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
                        <Ionicons name="star" size={12} color={colors.warning} />
                        <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
                        <Text style={styles.reviewText}>({product.reviewCount})</Text>
                      </View>

                      {/* Price */}
                      <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{product.price.toLocaleString()}</Text>
                        {hasMarkdown && (
                          <>
                            <Text style={styles.originalPrice}>
                              ₹{product.originalPrice.toLocaleString()}
                            </Text>
                            <View style={styles.discountBadge}>
                              <Text style={styles.discountText}>{discountPct}% OFF</Text>
                            </View>
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
              <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
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
    marginTop: 20,
    backgroundColor: "#fff",
    paddingVertical: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  headerIcon: { fontSize: 22 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  seeAllBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  seeAllText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  card: {
    width: 145,
    height: 275, // Fixed card height!
    flexDirection: "column",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  cardComingSoon: {
    opacity: 0.75,
  },
  imageWrap: {
    height: 130,
    backgroundColor: "#f4f6f4",
    position: "relative",
  },
  productImage: { width: "100%", height: "100%" },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  info: { 
    padding: 10, 
    gap: 4,
    flex: 1, // Stretch info container to take up remaining height
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 16,
    minHeight: 32,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  ratingText: { fontSize: 11, fontWeight: "700", color: colors.text },
  reviewText: { fontSize: 10, color: colors.textMuted },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  price: { fontSize: 13, fontWeight: "800", color: colors.text },
  originalPrice: {
    fontSize: 10,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  discountText: { fontSize: 9, fontWeight: "800", color: colors.primary },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 6,
    marginTop: 6,
    gap: 2,
  },
  addBtnText: { fontSize: 11, fontWeight: "700", color: colors.primary },
  addBtnDisabled: { borderColor: colors.textMuted },
  comingSoonText: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
});
