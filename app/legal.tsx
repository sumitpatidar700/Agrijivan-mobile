import React from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/lib/theme";

const LEGAL_CONTENT: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "AgriJivan collects only the information needed to run your account, process orders, and personalize farming recommendations - such as your name, contact details, delivery addresses, and the crops/farming items you select.",
      "We never sell your personal data. Information is shared with delivery and payment partners only as required to fulfil your orders.",
      "You can review or update your details anytime from User Profile, and request deletion of your account by contacting our support team.",
    ],
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    body: [
      "Orders are typically dispatched within 1-3 business days of confirmation and delivered within 3-10 business days depending on your location.",
      "You can track order status anytime from My Orders. You'll be notified if a delay occurs due to weather, logistics, or stock availability.",
      "Delivery charges, if any, are shown at checkout before you place your order.",
    ],
  },
  cancellation: {
    title: "Cancellation Policy",
    body: [
      "Orders can be cancelled free of charge before they are dispatched. Once an order has shipped, it can no longer be cancelled.",
      "To cancel an eligible order, open My Orders, select the order, and choose Cancel Order.",
      "Refunds for cancelled prepaid orders are processed to the original payment method within 5-7 business days.",
    ],
  },
  return: {
    title: "Return Policy",
    body: [
      "Physical products (seeds, equipment, medicine, feed) can be returned within 7 days of delivery if damaged, defective, or incorrect.",
      "To start a return, contact support with your order ID and photos of the item. Approved returns are picked up free of charge.",
      "Digital content such as courses and video access is non-returnable once purchased.",
    ],
  },
};

export default function LegalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { topic } = useLocalSearchParams<{ topic: string }>();

  const content = LEGAL_CONTENT[topic || "privacy"] || LEGAL_CONTENT.privacy;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {content.title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {content.body.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    ...shadow,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: colors.textOnDark, flex: 1, textAlign: "center" },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    ...shadow,
  },
  paragraph: { fontSize: 13, color: colors.text, lineHeight: 20 },
});
