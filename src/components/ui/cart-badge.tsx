import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, ViewStyle } from "react-native";
import { colors } from "@/lib/theme";

type CartBadgeProps = {
  count: number;
  style?: ViewStyle;
};

export function CartBadge({ count, style }: CartBadgeProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      scale.setValue(1);
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.5, useNativeDriver: true, speed: 30, bounciness: 12 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
      ]).start();
    }
    prevCount.current = count;
  }, [count, scale]);

  if (count <= 0) return null;

  return (
    <Animated.View style={[styles.badge, style, { transform: [{ scale }] }]}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: colors.red,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.header,
    paddingHorizontal: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
});
