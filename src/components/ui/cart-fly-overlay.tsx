import React from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCartFly } from "@/lib/cart-fly-context";
import { colors, shadow } from "@/lib/theme";

export function CartFlyOverlay() {
  const { flyItems } = useCartFly();

  if (flyItems.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {flyItems.map((item) => (
        <Animated.View
          key={item.id}
          style={[
            styles.icon,
            {
              opacity: item.opacity,
              transform: [...item.translate.getTranslateTransform(), { scale: item.scale }],
            },
          ]}
        >
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <Ionicons name="bag" size={20} color={colors.primary} />
          )}
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    position: "absolute",
    top: -20,
    left: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
    ...shadow,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
});
