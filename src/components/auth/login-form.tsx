import React, { useState } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "./logo";

type LoginFormProps = { onSuccess?: () => void; isEmbedded?: boolean };

export function LoginForm({ onSuccess, isEmbedded = false }: LoginFormProps) {
  const { loginWithoutOtp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [mobile, setMobile] = useState("");

  const handleSubmit = async () => {
    if (loading) return;
    if (!name.trim()) { setErrorMsg("Please enter your name."); return; }
    if (!location.trim()) { setErrorMsg("Please enter your village or city."); return; }
    if (!/^[6-9][0-9]{9}$/.test(mobile)) { setErrorMsg("Please enter a valid 10-digit Indian mobile number."); return; }
    setLoading(true);
    setErrorMsg(null);
    Keyboard.dismiss();
    try {
      await loginWithoutOtp("+91" + mobile, name.trim(), location.trim());
      onSuccess?.();
    } catch {
      setErrorMsg("Could not continue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <View style={isEmbedded ? { flex: 1 } : styles.formCard}>
      <View style={styles.header}>
        {!isEmbedded && <View style={styles.logoBadge}><Logo width={48} height={48} /></View>}
        <Text style={styles.title}>Welcome to AgriJivan</Text>
        <Text style={styles.subtitle}>Enter your details to explore farming guides and products. No OTP required.</Text>
        <Text style={styles.subtitle}>Temporary guest access. Your existing account is not signed in.</Text>
      </View>
      {errorMsg && <View style={styles.errorContainer} accessibilityLiveRegion="polite"><Ionicons name="alert-circle" size={18} color={colors.red} /><Text style={styles.errorText}>{errorMsg}</Text></View>}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Farmer Name</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={18} color={colors.textMuted} />
          <TextInput accessibilityLabel="Farmer Name" style={styles.input} placeholder="Enter Full Name" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} autoCapitalize="words" editable={!loading} />
        </View>
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Location or Village</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="location-outline" size={18} color={colors.textMuted} />
          <TextInput accessibilityLabel="Location or Village" style={styles.input} placeholder="Village, City or State" placeholderTextColor={colors.textMuted} value={location} onChangeText={setLocation} editable={!loading} />
        </View>
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="call-outline" size={18} color={colors.textMuted} />
          <Text style={styles.countryCodePrefix}>+91</Text>
          <TextInput accessibilityLabel="10-digit Mobile Number" style={styles.input} placeholder="10-digit Mobile Number" placeholderTextColor={colors.textMuted} value={mobile} onChangeText={(value) => setMobile(value.replace(/[^0-9]/g, ""))} keyboardType="phone-pad" maxLength={10} editable={!loading} />
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading, busy: loading }} style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.submitButtonText}>Continue without OTP</Text>}
      </Pressable>
    </View>
  );
  if (isEmbedded) return content;
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">{content}</ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#d1fae5",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#064e3b",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: radius.md,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  errorText: {
    fontSize: 13,
    color: colors.red,
    fontWeight: "600",
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    ...shadow,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#064e3b",
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "400",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#d1fae5",
    height: 48,
    gap: 10,
  },
  countryCodePrefix: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginRight: 2,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    height: "100%",
    padding: 0,
  },
  submitButton: {
    backgroundColor: "#10b981",
    height: 48,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#cbd5e1",
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  toggleBtn: {
    alignItems: "center",
    marginTop: 18,
  },
  toggleText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "700",
  },
  resendBtn: {
    alignItems: "center",
    marginTop: 12,
  },
  resendText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  otpGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    gap: 6,
  },
  otpBox: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: "#d1fae5",
    borderRadius: radius.md,
    backgroundColor: "#f8fafc",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#064e3b",
  },
  otpBoxFocused: {
    borderColor: "#10b981",
    backgroundColor: "#ffffff",
  },
  otpBoxDisabled: {
    borderColor: "#e2e8f0",
    backgroundColor: "#f1f5f9",
    opacity: 0.6,
  },
  mobileRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  inlineSendBtn: {
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: "#10b981",
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inlineSendBtnDisabled: {
    backgroundColor: "#cbd5e1",
    opacity: 0.6,
  },
  inlineSendBtnSent: {
    backgroundColor: "#064e3b",
  },
  inlineSendBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});


