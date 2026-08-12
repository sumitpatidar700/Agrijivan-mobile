import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, shadow } from "@/lib/theme";
import { Course, LEVEL_COLORS } from "@/lib/courses-data";

type CourseCardProps = {
  course: Course;
  onPress: () => void;
  onEnroll: () => void;
};

export function CourseCard({ course, onPress, onEnroll }: CourseCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: course.image }} style={styles.image} resizeMode="cover" />
        <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[course.level] }]}>
          <Text style={styles.levelBadgeText}>{course.level}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>

        <View style={styles.instructorRow}>
          <Ionicons name="person" size={13} color={colors.textMuted} />
          <Text style={styles.instructorText}>{course.instructor}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>{course.duration}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>{course.students}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.ratingText}>{course.rating}</Text>
          </View>
          <Text style={styles.originalPrice}>₹{course.originalPrice.toLocaleString("en-IN")}</Text>
          <Text style={styles.price}>₹{course.price.toLocaleString("en-IN")}</Text>
        </View>

        <Pressable style={styles.enrollBtn} onPress={onEnroll}>
          <Text style={styles.enrollBtnText}>Enroll Now</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 12,
    ...shadow,
  },
  imageWrap: {
    width: 110,
    aspectRatio: 0.82,
    alignSelf: "flex-start",
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  levelBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  levelBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 18,
  },
  instructorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  instructorText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  price: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "800",
  },
  enrollBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#e3f3e2",
    paddingVertical: 9,
    borderRadius: radius.pill,
    marginTop: 10,
  },
  enrollBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
});
