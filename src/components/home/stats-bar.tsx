import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/lib/theme";
import { t } from "@/lib/home-translations";

type StatsDef = {
  icon: "people-outline" | "play-circle-outline" | "headset-outline";
  valueKey: "stat1Value" | "stat2Value" | "stat3Value";
  labelKey: "stat1Label" | "stat2Label" | "stat3Label";
  bgColor: string;
};

const stats: StatsDef[] = [
  {
    icon: "people-outline",
    valueKey: "stat1Value",
    labelKey: "stat1Label",
    bgColor: colors.primary,
  },
  {
    icon: "play-circle-outline",
    valueKey: "stat2Value",
    labelKey: "stat2Label",
    bgColor: "#1565c0",
  },
  {
    icon: "headset-outline",
    valueKey: "stat3Value",
    labelKey: "stat3Label",
    bgColor: "#6a1b9a",
  },
];

type StatsBarProps = {
  locale: string | null;
};

export function StatsBar({ locale }: StatsBarProps) {
  return (
    <View style={styles.container}>
      {stats.map((stat, idx) => (
        <React.Fragment key={stat.labelKey}>
          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: stat.bgColor }]}>
              <Ionicons name={stat.icon} size={20} color="#fff" />
            </View>
            <View style={styles.statTexts}>
              <Text style={styles.statValue}>{t(locale, stat.valueKey)}</Text>
              <Text style={styles.statLabel}>{t(locale, stat.labelKey)}</Text>
            </View>
          </View>
          {idx < stats.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    justifyContent: "center",
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  statTexts: { flexShrink: 1 },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 20,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "500",
    lineHeight: 14,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
});
