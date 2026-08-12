import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/lib/theme";

const categories = [
  { label: "Seeds", icon: "leaf-outline" as const, color: colors.blue },
  { label: "Crops", icon: "nutrition-outline" as const, color: colors.accent },
  { label: "Tools", icon: "construct-outline" as const, color: colors.red },
  { label: "Guides", icon: "book-outline" as const, color: colors.yellow },
];

export function CategoryRow({ title = "Browse by Category" }: { title?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.row}>
        {categories.map((item) => (
          <Pressable key={item.label} style={styles.item}>
            <View style={[styles.iconCircle, { backgroundColor: `${item.color}22` }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  item: {
    alignItems: "center",
    width: "22%",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
});
