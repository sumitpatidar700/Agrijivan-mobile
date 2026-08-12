import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/lib/theme";

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleCall = () => {
    Linking.openURL("tel:+918319897767").catch((err) =>
      console.warn("Failed to initiate call:", err)
    );
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent("Hello AgriJivan Support, I need help with my orders.");
    Linking.openURL(`https://wa.me/918319897767?text=${text}`).catch((err) =>
      console.warn("Failed to open WhatsApp:", err)
    );
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@agrijivan.com").catch((err) =>
      console.warn("Failed to initiate email:", err)
    );
  };

  const faqs = [
    {
      q: "How can I track my order status?",
      a: "Go to your Account tab and select 'My Orders'. You can view order statuses, payment calculations, and real-time updates.",
    },
    {
      q: "What payment methods are supported?",
      a: "Currently, we support Cash on Delivery (COD) for all physical guidebooks, organic seeds, and agricultural equipment orders.",
    },
    {
      q: "How do I update my delivery address?",
      a: "Open your Account tab, click on the 'Address' menu, and you can edit or add multiple delivery destinations.",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Support Card info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>AgriJivan Helpline</Text>
          <Text style={styles.infoSubtitle}>
            We are available 24/7 to solve your farming queries, order status, and catalog inputs.
          </Text>

          <Text style={styles.phoneLabel}>Helpline Number</Text>
          <Text style={styles.phoneVal}>+91 83198 97767</Text>

          <View style={styles.actionGrid}>
            <Pressable style={styles.supportActionBtn} onPress={handleCall}>
              <View style={[styles.iconWrap, { backgroundColor: "#e0f2fe" }]}>
                <Ionicons name="call" size={20} color="#0284c7" />
              </View>
              <Text style={styles.actionBtnText}>Call Us</Text>
            </Pressable>

            <Pressable style={styles.supportActionBtn} onPress={handleWhatsApp}>
              <View style={[styles.iconWrap, { backgroundColor: "#dcfce7" }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#16a34a" />
              </View>
              <Text style={styles.actionBtnText}>WhatsApp</Text>
            </Pressable>

            <Pressable style={styles.supportActionBtn} onPress={handleEmail}>
              <View style={[styles.iconWrap, { backgroundColor: "#fee2e2" }]}>
                <Ionicons name="mail" size={20} color="#dc2626" />
              </View>
              <Text style={styles.actionBtnText}>Email</Text>
            </Pressable>
          </View>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {faqs.map((faq, idx) => (
            <View key={idx} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    ...shadow,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textOnDark,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    ...shadow,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  infoSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  phoneLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  phoneVal: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
    marginBottom: 24,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  supportActionBtn: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginTop: 10,
    marginBottom: -8,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  faqAnswer: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
