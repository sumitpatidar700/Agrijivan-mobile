import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";

import { colors, radius, shadow } from "@/lib/theme";

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    ...shadow,
  },
});
