import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

import { colors, radius } from "@/lib/theme";

/**
 * A single shimmering placeholder block. Use these to reserve the real layout
 * while data loads, instead of rendering placeholder/dummy content.
 */
export function Skeleton({
  width,
  height,
  radius: r = 8,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: r, backgroundColor: "#e3e8e4", opacity: pulse },
        style,
      ]}
    />
  );
}

/** Placeholder matching one card in the home ProductSection carousel. */
function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={130} radius={0} />
      <View style={styles.cardInfo}>
        <Skeleton width="90%" height={11} />
        <Skeleton width="65%" height={11} />
        <Skeleton width="45%" height={13} style={{ marginTop: 6 }} />
        <Skeleton width="100%" height={28} radius={radius.sm} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

/**
 * Full placeholder for a home product carousel — mirrors ProductSection's
 * header + horizontal card row so the layout doesn't jump when data arrives.
 */
export function ProductSectionSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={{ gap: 6 }}>
          <Skeleton width={140} height={15} />
          <Skeleton width={190} height={11} />
        </View>
        <Skeleton width={64} height={28} radius={radius.pill} />
      </View>

      <View style={styles.row}>
        {Array.from({ length: cards }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    backgroundColor: colors.surface,
    paddingVertical: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
  },
  card: {
    width: 145,
    height: 275,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  cardInfo: {
    padding: 10,
    gap: 6,
  },
});
