import React, { useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, shadow } from "@/lib/theme";

// Mirrors the web's TrainingSection "overview" masterclass box
// (frontend/src/components/portal-sections/TrainingSection.tsx). Hardcoded for now —
// same as the community-impact section, this stands in until a real featured course
// is wired up from the products/masterclass data.

const COURSE = {
  title: "Pig Farming Medicine & Disease Management",
  description:
    "Learn the essential medicines, vaccines, deworming schedules, and disease prevention techniques used in commercial pig farming. This training covers the identification of common pig diseases, proper treatment methods, vaccination programs, biosecurity practices, and maintaining herd health for higher productivity and reduced mortality.",
  bullets: ["Breed Selection Mastery", "Cost Reduction Techniques", "Govt Subsidy Guidance"],
  image:
    "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=700&q=80",
  videoUrl: "https://www.youtube.com/@Agrijivanfarming",
};

const WHATSAPP_URL = `https://wa.me/918319897767?text=${encodeURIComponent(
  `Hello AgriJivan, I want to enroll in the ${COURSE.title}. Please guide me with details.`,
)}`;

export function TrainingProgramsSection() {
  const [expanded, setExpanded] = useState(false);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.section}>
      <Text style={styles.headline}>Expert Training Programs</Text>
      <View style={styles.underline} />

      <View style={styles.card}>
        <View style={styles.topRow}>
          <Pressable style={styles.videoWrap} onPress={() => openLink(COURSE.videoUrl)}>
            <Image source={{ uri: COURSE.image }} style={styles.videoImage} />
            <View style={styles.videoOverlay} />
            <View style={styles.playButton}>
              <Ionicons name="play" size={18} color="#fff" />
            </View>
          </Pressable>

          <View style={styles.bulletList}>
            {COURSE.bullets.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <View style={styles.bulletCheck}>
                  <Ionicons name="checkmark" size={11} color="#fff" />
                </View>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>PREMIUM TRAINING</Text>
        </View>

        <Text style={styles.title}>{COURSE.title}</Text>
        <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
          {COURSE.description}
        </Text>
        <Pressable style={styles.seeMoreBtn} onPress={() => setExpanded(!expanded)}>
          <Text style={styles.seeMoreText}>{expanded ? "View Less" : "See More"}</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={13}
            color={colors.primary}
          />
        </Pressable>

        <Pressable style={styles.enrollBtn} onPress={() => openLink(WHATSAPP_URL)}>
          <Text style={styles.enrollBtnText}>Enroll Now 🚀</Text>
        </Pressable>
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
    alignItems: "center",
  },
  headline: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  underline: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primaryLight,
    marginTop: 8,
    marginBottom: 18,
  },

  card: {
    width: "100%",
    backgroundColor: "#eaf6f0",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#bae6d4",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#15803d",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 25,
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
    marginTop: 6,
    marginBottom: 16,
  },
  seeMoreText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: colors.primary,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  bulletList: {
    flex: 1,
    minWidth: 0, // without this, a flex row's child won't shrink and text overflows instead of wrapping
    gap: 9,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  bulletCheck: {
    width: 17,
    height: 17,
    borderRadius: 9,
    marginTop: 1,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    flexWrap: "wrap",
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.text,
  },

  enrollBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: radius.pill,
    marginBottom: 18,
    ...shadow,
  },
  enrollBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  videoWrap: {
    width: 180,
    aspectRatio: 16 / 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    position: "relative",
  },
  videoImage: {
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -18,
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
});
