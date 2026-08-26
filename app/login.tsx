import React from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/auth/logo";
import { colors } from "@/lib/theme";

export default function LoginScreen({ hideBackButton = false }: { hideBackButton?: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.outerScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Dark Green Header background section - scrolls with the form when the keyboard opens */}
        <View style={[styles.headerSection, { paddingTop: insets.top + 20 }]}>
          {!hideBackButton && (
            <Pressable
              style={[styles.floatingBackBtn, { top: insets.top + 12 }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </Pressable>
          )}

          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Logo width={34} height={34} />
            </View>
            <Text style={styles.brandName}>AgriJivan</Text>
            <Text style={styles.brandSub}>Smart Farming, Better Yield</Text>
          </View>
        </View>

        {/* Overlapping Content Card */}
        <View style={styles.contentCard}>
          <View style={styles.scrollContent}>
            <LoginForm onSuccess={() => router.replace("/(tabs)")} isEmbedded />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  outerScrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    backgroundColor: colors.header,
    alignItems: "center",
    paddingBottom: 68,
    position: "relative",
  },
  floatingBackBtn: {
    position: "absolute",
    left: 20,
    zIndex: 50,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  brandContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  logoBadge: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    marginTop: 12,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 13,
    fontWeight: "600",
    color: "#d1fae5",
    marginTop: 4,
  },
  contentCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -40,
    position: "relative",
    overflow: "hidden",
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
});
