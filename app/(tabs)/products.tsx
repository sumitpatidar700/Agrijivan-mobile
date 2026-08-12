import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadow } from "@/lib/theme";
import { useActiveFarming } from "@/lib/active-farming-context";
import { CourseCard } from "@/components/courses/course-card";
import { COURSES, SPECIALIZATIONS } from "@/lib/courses-data";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=700&q=80";

export default function CoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeFarming } = useActiveFarming();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("all");

  const farmingName = activeFarming?.name || "Pig Farming";
  const farmingShortName = farmingName.replace(/\s*Farming\s*/i, "").trim() || "Pig";

  const filteredCourses = useMemo(() => {
    return COURSES.filter((course) => {
      const specMatch = selectedSpec === "all" || course.specialization === selectedSpec;
      const query = searchQuery.trim().toLowerCase();
      const searchMatch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.instructor.toLowerCase().includes(query);
      return specMatch && searchMatch;
    });
  }, [searchQuery, selectedSpec]);

  const specRow1 = SPECIALIZATIONS.slice(0, 4);
  const specRow2 = SPECIALIZATIONS.slice(4);

  const handleOpenCourse = (id: string) => {
    router.push({ pathname: "/course-details", params: { id } });
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTopRow}>
          <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.headerTitle}>{farmingName} Courses</Text>
            <Text style={styles.headerSubtitle}>Learn • Grow • Earn</Text>
          </View>
          <Pressable style={styles.headerIconBtn} onPress={() => router.push("/preferences")}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
        <View style={styles.content}>
        {/* Hero banner */}
        <View style={styles.hero}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Build a Profitable{"\n"}{farmingShortName} Farm</Text>
            <View style={styles.heroPill}>
              <Ionicons name="school" size={14} color={colors.header} />
              <Text style={styles.heroPillText}>Expert Training Programs</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search training..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Specializations */}
        <Text style={styles.sectionTitle}>Specializations</Text>
        <View style={styles.specGrid}>
          <View style={styles.specRow}>
            {SPECIALIZATIONS.map((spec) => {
              const isSelected = spec.id === selectedSpec;
              return (
                <Pressable key={spec.id} style={styles.specItem} onPress={() => setSelectedSpec(spec.id)}>
                  <View style={[styles.specIconBox, { backgroundColor: isSelected ? spec.color : spec.bgLight }]}>
                    <Ionicons name={spec.icon as any} size={16} color={isSelected ? "#fff" : spec.color} />
                  </View>
                  <Text style={styles.specLabel} numberOfLines={2}>
                    {spec.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Available Programs */}
        <View style={styles.programsHeader}>
          <Text style={styles.sectionTitle}>Available Programs ({filteredCourses.length})</Text>
          <View style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        </View>

        <View style={styles.coursesList}>
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => handleOpenCourse(course.id)}
              onEnroll={() => handleOpenCourse(course.id)}
            />
          ))}
          {filteredCourses.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyText}>No courses found</Text>
            </View>
          )}
        </View>
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
  header: {
    backgroundColor: colors.header,
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  scrollBody: {
    flex: 1,
    backgroundColor: colors.header,
    marginTop: -24, // overlap the header, so the rounded top of `content` tucks under it
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    padding: 16,
    paddingBottom: 40,
  },
  hero: {
    height: 120,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.primary,
    marginBottom: 18,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 48, 2, 0.55)",
  },
  heroContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 23,
    marginBottom: 10,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  heroPillText: {
    color: colors.header,
    fontSize: 12,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  specGrid: {
    marginTop: 12,
    marginBottom: 20,
  },
  specRow: {
    flexDirection: "row",
    gap: 4,
  },
  specItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 4,
  },
  specIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  specLabel: {
    width: "100%",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  programsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  coursesList: {
    gap: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
});
