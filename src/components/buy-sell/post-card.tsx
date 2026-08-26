import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, shadow } from "@/lib/theme";
import type { TradePost } from "@/api/buy-sell";

type PostCardProps = {
  post: TradePost;
};

const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&q=80";

function formatPostedAt(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function PostCard({ post }: PostCardProps) {
  const isBuy = post.kind === "buy";
  const location = [post.village, post.district, post.state].filter(Boolean).join(", ") || "Location not set";

  const digitsOnly = post.contactNumber.replace(/[^0-9]/g, "");
  const handleCall = () => {
    if (post.comingSoon) {
      Alert.alert("Coming Soon", "Listings for this farming type aren't live yet - check back soon!");
      return;
    }
    if (digitsOnly) Linking.openURL(`tel:${digitsOnly}`).catch(() => {});
  };
  const handleWhatsApp = () => {
    if (post.comingSoon) {
      Alert.alert("Coming Soon", "Listings for this farming type aren't live yet - check back soon!");
      return;
    }
    if (digitsOnly) Linking.openURL(`https://wa.me/91${digitsOnly}`).catch(() => {});
  };

  return (
    <View style={[styles.card, post.comingSoon && styles.cardComingSoon]}>
      <View style={styles.topRow}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: post.photos[0] || FALLBACK_PHOTO }} style={styles.image} resizeMode="cover" />
          <View style={[styles.badge, { backgroundColor: post.comingSoon ? colors.textMuted : isBuy ? colors.primary : "#e07b00" }]}>
            <Ionicons name={isBuy ? "cart" : "pricetag"} size={11} color="#fff" />
            <Text style={styles.badgeText}>{post.comingSoon ? "COMING SOON" : isBuy ? "BUY" : "SELL"}</Text>
          </View>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{formatPostedAt(post.createdAt)}</Text>
          </View>
          <View style={styles.imageLabelWrap}>
            <Text style={styles.imageLabel} numberOfLines={1}>
              {post.farmingItemName}
            </Text>
          </View>
        </View>

        <View style={styles.attrsCol}>
          <Text style={styles.postTitle} numberOfLines={2}>
            {post.title}
          </Text>
          {!!post.quantity && (
            <View style={styles.attrRow}>
              <Ionicons name="layers-outline" size={13} color={colors.textMuted} />
              <Text style={styles.attrLabel}>Quantity</Text>
              <Text style={styles.attrValue} numberOfLines={1}>
                {post.quantity} {post.unit}
              </Text>
            </View>
          )}
          {!!post.description && (
            <Text style={styles.postDescription} numberOfLines={2}>
              {post.description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.userBlock}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color={colors.primary} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {post.farmerName}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} />
              <Text style={styles.locationText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>{isBuy ? "Budget:" : "Price:"}</Text>
          <Text style={styles.priceValue}>₹{post.price}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionBtn} onPress={handleCall}>
          <Ionicons name="call" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Call</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.whatsappBtn]} onPress={handleWhatsApp}>
          <Ionicons name="logo-whatsapp" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>WhatsApp</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    ...shadow,
  },
  cardComingSoon: {
    opacity: 0.75,
  },
  topRow: {
    flexDirection: "row",
    gap: 12,
  },
  imageWrap: {
    width: 130,
    height: 145,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  imageLabelWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  imageLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  attrsCol: {
    flex: 1,
    justifyContent: "flex-start",
    gap: 8,
    paddingVertical: 4,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 19,
  },
  postDescription: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  attrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attrLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
    flex: 1,
  },
  attrValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "800",
    flexShrink: 1,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  userBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  priceBlock: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  priceValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "800",
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: radius.pill,
  },
  whatsappBtn: {
    backgroundColor: "#25D366",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  timeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  timeBadgeText: {
    color: "#fff",
    fontSize: 9.5,
    fontWeight: "700",
  },
});
