import React, { useEffect, useRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/lib/theme";

export type CompletedOrder = {
  id: string;
  itemCount: number;
  total: number;
  paymentMethod: "cod" | "online";
};

type OrderSuccessModalProps = {
  visible: boolean;
  order: CompletedOrder | null;
  onViewDetails: () => void;
  onContinueShopping: () => void;
};

const SPARKLES: { top: number; left?: number; right?: number; size: number; delay: number }[] = [
  { top: 8, left: 30, size: 14, delay: 120 },
  { top: 20, right: 26, size: 10, delay: 220 },
  { top: 62, left: 14, size: 9, delay: 320 },
  { top: 68, right: 10, size: 13, delay: 180 },
];

export function OrderSuccessModal({ visible, order, onViewDetails, onContinueShopping }: OrderSuccessModalProps) {
  const insets = useSafeAreaInsets();
  const checkScale = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(16)).current;
  const sparkleAnims = useRef(SPARKLES.map(() => new Animated.Value(0))).current;
  const player = useAudioPlayer(require("../../../assets/sounds/order-success.wav"));

  useEffect(() => {
    if (!visible) return;

    player.seekTo(0).then(() => player.play());

    checkScale.setValue(0);
    ringScale.setValue(0);
    ringOpacity.setValue(1);
    contentOpacity.setValue(0);
    contentTranslate.setValue(16);
    sparkleAnims.forEach((v) => v.setValue(0));

    Animated.sequence([
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(contentTranslate, { toValue: 0, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.timing(ringScale, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    Animated.timing(ringOpacity, {
      toValue: 0,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    SPARKLES.forEach((sparkle, i) => {
      Animated.sequence([
        Animated.delay(sparkle.delay),
        Animated.spring(sparkleAnims[i], { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 18 }),
      ]).start();
    });
  }, [visible]);

  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinueShopping}>
      <View style={styles.overlay}>
        <View style={[styles.card, { marginBottom: insets.bottom + 24 }]}>
          {/* Celebratory header banner */}
          <View style={styles.banner}>
            {SPARKLES.map((sparkle, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.sparkle,
                  {
                    top: sparkle.top,
                    left: sparkle.left,
                    right: sparkle.right,
                    opacity: sparkleAnims[i],
                    transform: [
                      { scale: sparkleAnims[i] },
                      {
                        rotate: sparkleAnims[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: ["-45deg", "0deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="sparkles" size={sparkle.size} color={colors.primary} />
              </Animated.View>
            ))}

            <View style={styles.checkWrap}>
              <Animated.View
                style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]}
              />
              <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
                <Ionicons name="checkmark" size={38} color="#fff" />
              </Animated.View>
            </View>
          </View>

          <Animated.View style={[styles.body, { opacity: contentOpacity, transform: [{ translateY: contentTranslate }] }]}>
            <Text style={styles.title}>Order Placed!</Text>
            <Text style={styles.subtitle}>
              {order.paymentMethod === "online"
                ? "Payment received - your order is confirmed."
                : "Your order is confirmed for Cash on Delivery."}
            </Text>

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Order ID</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {order.id}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items</Text>
                <Text style={styles.summaryValue}>{order.itemCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Paid</Text>
                <Text style={styles.summaryValueLarge}>₹{order.total}</Text>
              </View>
              <View style={styles.deliveryRow}>
                <Ionicons name="cube-outline" size={16} color={colors.primary} />
                <Text style={styles.deliveryText}>Arrives in 4-5 working days</Text>
              </View>
            </View>

            <Pressable style={styles.primaryBtn} onPress={onViewDetails}>
              <Text style={styles.primaryBtnText}>View Order Details</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={onContinueShopping}>
              <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow,
  },
  banner: {
    width: "100%",
    backgroundColor: "#eafaf0",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    position: "relative",
  },
  sparkle: {
    position: "absolute",
  },
  checkWrap: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  body: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 21,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  summaryBox: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "800",
    flexShrink: 1,
    marginLeft: 12,
    textAlign: "right",
  },
  summaryValueLarge: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "900",
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  primaryBtn: {
    width: "100%",
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadow,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryBtn: {
    width: "100%",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  secondaryBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
});
