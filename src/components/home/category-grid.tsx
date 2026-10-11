import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/lib/theme";
import { t } from "@/lib/home-translations";

type IconType = "mci" | "fa5" | "ion";

type CategoryItem = {
  key: string;
  type: IconType;
  icon: string;
  size?: number;
  section: string;
  hubKey: string;
};

// Exact UI matching the home category grid:
// Row 1: Books, Equipment, Medicine, Feed, Farm Map
// Row 2: Vet, Training, Videos, Loan, Blogs
const categoryKeys: CategoryItem[] = [
  { key: "catBooks",           type: "mci", icon: "book-multiple",      size: 20, section: "books",        hubKey: "books" },
  { key: "catEquipment",       type: "fa5", icon: "tools",              size: 17, section: "equipment",    hubKey: "equipment" },
  { key: "catMedicine",        type: "mci", icon: "bottle-tonic-plus",  size: 19, section: "medicine",     hubKey: "medicine" },
  { key: "catFeedSupplements", type: "mci", icon: "sack",               size: 19, section: "feed",         hubKey: "feed_supplements" },
  { key: "catFarmMap",         type: "fa5", icon: "map-marked-alt",     size: 18, section: "farm_map",     hubKey: "farm_map" },
  { key: "catVet",             type: "fa5", icon: "user-md",            size: 18, section: "veterinarian", hubKey: "veterinarian" },
  { key: "catTraining",        type: "fa5", icon: "chalkboard-teacher", size: 18, section: "training",     hubKey: "training" },
  { key: "catVideos",          type: "ion", icon: "play-circle",        size: 21, section: "videos",       hubKey: "videos" },
  { key: "catLoan",            type: "mci", icon: "hand-coin",          size: 19, section: "loan_subsidy", hubKey: "loan_subsidy" },
  { key: "catBlogs",           type: "mci", icon: "file-document-edit", size: 19, section: "blogs",        hubKey: "blogs" },
];

function RenderIcon({ type, icon, size, color }: { type: IconType; icon: string; size: number; color: string }) {
  if (type === "fa5") {
    return <FontAwesome5 name={icon} size={size} color={color} />;
  }
  if (type === "ion") {
    return <Ionicons name={icon as any} size={size} color={color} />;
  }
  return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
}

type CategoryGridProps = {
  locale: string | null;
  onCategoryPress?: (section: string) => void;
  isSectionVisible?: (hubKey: string) => boolean;
};

export function CategoryGrid({ locale, onCategoryPress, isSectionVisible }: CategoryGridProps) {
  const visibleCategoryKeys = isSectionVisible
    ? categoryKeys.filter((item) => isSectionVisible(item.hubKey))
    : categoryKeys;

  // Symmetrically display 5 items per row
  const ROW_SIZE = 5;
  const row1 = visibleCategoryKeys.slice(0, ROW_SIZE);
  const row2 = visibleCategoryKeys.slice(ROW_SIZE);

  // Deep dark green for solid icons and extra light subtle green for container background
  const iconColor = "#156524";
  const bgColor = "#F0F8F2";

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
              <View style={[styles.iconSquircle, { backgroundColor: bgColor }]}>
                <RenderIcon
                  type={item.type}
                  icon={item.icon}
                  size={item.size ?? 19}
                  color={iconColor}
                />
              </View>
              <Text style={styles.label} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {row2.length > 0 && (
        <View style={[styles.row, { marginTop: 12 }]}>
          {row2.map((item) => {
            const label = t(locale, item.key);
            return (
              <Pressable
                key={item.key}
                style={styles.item}
                onPress={() => onCategoryPress?.(item.section)}
              >
                <View style={[styles.iconSquircle, { backgroundColor: bgColor }]}>
                  <RenderIcon
                    type={item.type}
                    icon={item.icon}
                    size={item.size ?? 19}
                    color={iconColor}
                  />
                </View>
                <Text style={styles.label} numberOfLines={1}>
                  {label}
                </Text>
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
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  item: {
    alignItems: "center",
    width: "19%",
  },
  iconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2C3E50",
    textAlign: "center",
    lineHeight: 13,
  },
});

