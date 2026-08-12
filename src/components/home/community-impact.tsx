import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { colors, radius, shadow } from "@/lib/theme";

// Mirrors the web's StatsSection + GallerySection (frontend/src/components/item-portal.tsx).
// Hardcoded for now, same as the web version — this is marketing/social-proof copy,
// not per-farming data, so it isn't wired to the DB.

const STATS = [
  { value: "12K+", label: "YouTube" },
  { value: "2M+", label: "Instagram" },
  { value: "2.6M+", label: "Facebook" },
  { value: "9 Lakh+", label: "Views" },
];

const IMAGES = [
  "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=400&q=80",
];

const GOAL_TEXT = "Our goal is to create the world's most impactful and prosperous farming ecosystem.";

export function CommunityImpactSection() {
  return (
    <View style={styles.section}>
      {/* Header */}
      <Text style={styles.eyebrow}>We are a Family of</Text>
      <Text style={styles.headline}>12K+ PASSIONATE FARMERS</Text>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {STATS.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>
              {stat.value}
            </Text>
            <Text numberOfLines={1} style={styles.statLabel}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Photo gallery */}
      <View style={styles.gallery}>
        <View style={styles.galleryRow}>
          <Image source={{ uri: IMAGES[0] }} style={styles.imgSquare} />
          <Image source={{ uri: IMAGES[1] }} style={styles.imgSquare} />
          <Image source={{ uri: IMAGES[2] }} style={styles.imgSquare} />
        </View>

        <View style={styles.galleryRow}>
          <View style={styles.goalCard}>
            <Text style={styles.goalText}>{GOAL_TEXT}</Text>
          </View>
          <Image source={{ uri: IMAGES[3] }} style={styles.imgWide} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    backgroundColor: colors.surface,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  eyebrow: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
    textAlign: "center",
  },
  headline: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
    letterSpacing: 0.3,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.2,
    marginTop: 3,
  },

  gallery: {
    gap: 10,
  },
  galleryRow: {
    flexDirection: "row",
    gap: 10,
  },
  imgSquare: {
    flex: 1,
    height: 90,
    borderTopRightRadius: radius.sm,
    backgroundColor: "#eef1ee",
  },
  imgWide: {
    flex: 1,
    height: 150,
    borderTopRightRadius: radius.sm,
    backgroundColor: "#eef1ee",
  },
  goalCard: {
    flex: 1,
    height: 150,
    backgroundColor: colors.primary,
    borderTopRightRadius: radius.md,
    borderBottomLeftRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    justifyContent: "center",
    ...shadow,
  },
  goalText: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "center",
  },
});
