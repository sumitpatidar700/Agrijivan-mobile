import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadow } from "@/lib/theme";
import { COURSES, LEVEL_COLORS } from "@/lib/courses-data";

export default function CourseDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const course = COURSES.find((c) => c.id === id) || COURSES[0];

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: course.image }} style={styles.image} resizeMode="cover" />
          <Pressable
            style={[styles.closeBtn, { top: insets.top + 10 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
          <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[course.level] }]}>
            <Text style={styles.levelBadgeText}>{course.level}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{course.title}</Text>
          <View style={styles.instructorRow}>
            <Ionicons name="person" size={14} color={colors.textMuted} />
            <Text style={styles.instructorText}>By {course.instructor}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={styles.statText}>{course.duration}</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="people-outline" size={14} color={colors.primary} />
              <Text style={styles.statText}>{course.students}</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={styles.statText}>{course.rating}/5</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Course Overview</Text>
          <Text style={styles.overviewText}>{course.overview}</Text>

          <View style={styles.highlightsBox}>
            {course.highlights.map((item) => (
              <View key={item} style={styles.highlightRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.highlightText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.originalPrice}>₹{course.originalPrice.toLocaleString("en-IN")}</Text>
            <Text style={styles.price}>₹{course.price.toLocaleString("en-IN")}</Text>
          </View>

          <Pressable
            style={styles.registerBtn}
            onPress={() => router.push({ pathname: "/admission-form", params: { id: course.id } })}
          >
            <Text style={styles.registerBtnText}>Register Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageWrap: {
    height: 320,
    backgroundColor: "#eee",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  levelBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  content: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 27,
  },
  instructorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  instructorText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#e3f3e2",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  statText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  overviewText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
  },
  highlightsBox: {
    backgroundColor: "#eaf7e9",
    borderRadius: radius.md,
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  highlightText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginTop: 20,
  },
  originalPrice: {
    fontSize: 15,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  price: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: "800",
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.pill,
    marginTop: 20,
    ...shadow,
  },
  registerBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
