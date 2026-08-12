import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius } from "@/lib/theme";
import { t } from "@/lib/home-translations";

// `section` is the route param passed to /see-all; `hubKey` is the Category Hub section
// key that controls whether this icon is visible at all (mirrors the web item-portal tabs).
const categoryKeys = [
  { key: "catBooks",           icon: "book-outline" as const,           section: "books",        hubKey: "books" },
  { key: "catEquipment",       icon: "construct-outline" as const,      section: "equipment",    hubKey: "equipment" },
  { key: "catMedicine",        icon: "medkit-outline" as const,         section: "medicine",     hubKey: "medicine" },
  { key: "catFeedSupplements", icon: "nutrition-outline" as const,      section: "feed",         hubKey: "feed_supplements" },
  { key: "catFarmMap",         icon: "map-outline" as const,            section: "farm_map",     hubKey: "farm_map" },
  { key: "catVet",             icon: "person-circle-outline" as const,  section: "veterinarian", hubKey: "veterinarian" },
  { key: "catTraining",        icon: "school-outline" as const,         section: "training",     hubKey: "training" },
  { key: "catVideos",          icon: "play-circle-outline" as const,    section: "videos",       hubKey: "videos" },
  { key: "catLoan",            icon: "cash-outline" as const,           section: "loan_subsidy", hubKey: "loan_subsidy" },
  { key: "catBlogs",           icon: "newspaper-outline" as const,      section: "blogs",        hubKey: "blogs" },
] as const;

type CategoryGridProps = {
  locale: string | null;
  onCategoryPress?: (section: string) => void;
  isSectionVisible?: (hubKey: string) => boolean;
};

export function CategoryGrid({ locale, onCategoryPress, isSectionVisible }: CategoryGridProps) {
  const visibleCategoryKeys = isSectionVisible
    ? categoryKeys.filter((item) => isSectionVisible(item.hubKey))
    : categoryKeys;

  // Fill row 1 up to ROW_SIZE first, only overflow into row 2 if there are more items
  // left after filtering - so hidden icons don't leave a sparse, gappy second row.
  const ROW_SIZE = 5;
  const row1 = visibleCategoryKeys.slice(0, ROW_SIZE);
  const row2 = visibleCategoryKeys.slice(ROW_SIZE);

  const iconColor = colors.headerDark; // Dark green color
  const bgColor = `${colors.headerDark}12`; // Light green tint background

  if (visibleCategoryKeys.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        {row1.map((item) => {
          const label = t(locale, item.key);
          return (
            <Pressable
              key={item.key}
              style={styles.item}
              onPress={() => onCategoryPress?.(item.section)}
            >
              <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
                <Ionicons name={item.icon} size={20} color={iconColor} />
              </View>
              <Text style={styles.label}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      {row2.length > 0 && (
        <View style={[styles.row, { marginTop: 10 }]}>
          {row2.map((item) => {
            const label = t(locale, item.key);
            return (
              <Pressable
                key={item.key}
                style={styles.item}
                onPress={() => onCategoryPress?.(item.section)}
              >
                <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
                  <Ionicons name={item.icon} size={20} color={iconColor} />
                </View>
                <Text style={styles.label}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 6,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
  },
  item: {
    alignItems: "center",
    width: "15.5%",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    lineHeight: 12,
  },
});
