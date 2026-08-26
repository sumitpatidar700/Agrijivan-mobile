import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius } from "@/lib/theme";

export type VideoCardData = {
  id: string;
  title: string;
  thumbnail: string | null;
  summary: string;
  category: string | null;
  isPaid: boolean;
  comingSoon?: boolean;
};

type VideoListCardProps = {
  video: VideoCardData;
  onPress: () => void;
  compact?: boolean;
};

const FALLBACK_THUMB = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&q=80";

export function VideoListCard({ video, onPress, compact = false }: VideoListCardProps) {
  return (
    <Pressable style={[styles.card, video.comingSoon && styles.cardComingSoon]} onPress={onPress}>
      <View style={[styles.thumbWrap, compact && styles.thumbWrapCompact]}>
        <Image source={{ uri: video.thumbnail || FALLBACK_THUMB }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.playOverlay}>
          <Ionicons name="play" size={18} color="#fff" />
        </View>
        {video.comingSoon ? (
          <View style={[styles.paidBadge, { backgroundColor: colors.textMuted }]}>
            <Text style={styles.paidBadgeText}>COMING SOON</Text>
          </View>
        ) : (
          video.isPaid && (
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>PAID</Text>
            </View>
          )
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {video.title}
          </Text>
          <Ionicons name="open-outline" size={16} color={colors.textMuted} />
        </View>

        {!compact && (
          <>
            {!!video.category && (
              <View style={styles.categoryRow}>
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{video.category}</Text>
                </View>
              </View>
            )}
            {!!video.summary && (
              <Text style={styles.description} numberOfLines={2}>
                {video.summary}
              </Text>
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
  },
  cardComingSoon: {
    opacity: 0.75,
  },
  thumbWrap: {
    width: 148,
    aspectRatio: 16 / 11,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: "#eee",
    position: "relative",
  },
  thumbWrapCompact: {
    width: 100,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  paidBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 19,
  },
  categoryRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  categoryChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  categoryChipText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.textMuted,
  },
  description: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
});
