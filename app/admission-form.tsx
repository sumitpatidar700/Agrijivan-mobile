import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadow } from "@/lib/theme";
import { useActiveFarming } from "@/lib/active-farming-context";
import { SelectField } from "@/components/ui/select-field";
import { COURSES } from "@/lib/courses-data";

const EXPERIENCE_OPTIONS = ["None (Beginner)", "Less than 1 year", "1-3 years", "3-5 years", "5+ years"];
const FARM_SIZE_OPTIONS = ["No farm yet", "Small (< 1 acre)", "Medium (1-5 acres)", "Large (5+ acres)", "Commercial scale"];
const PURPOSE_OPTIONS = ["Start a new farm", "Improve existing farm", "Career / Job opportunity", "Academic / Research", "Personal interest"];

export default function AdmissionFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeFarming } = useActiveFarming();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const course = COURSES.find((c) => c.id === id) || COURSES[0];
  const farmingShortName = (activeFarming?.name || "Pig Farming").replace(/\s*Farming\s*/i, "").trim() || "Pig";

  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [location, setLocation] = useState("");
  const [purpose, setPurpose] = useState("");

  const canSubmit = Boolean(fullName && whatsapp.length === 10);

  const handleSubmit = () => {
    if (!canSubmit) return;
    Alert.alert("Application Submitted", `You're on the list for ${course.title}. Our team will reach out on WhatsApp shortly.`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>Admission Form</Text>
          <Text style={styles.headerSubtitle}>Fill in your details to enroll in this course</Text>
        </View>
        <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.group}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={17} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>
              WhatsApp Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={17} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Mobile number"
                placeholderTextColor={colors.textMuted}
                value={whatsapp}
                onChangeText={(text) => setWhatsapp(text.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={17} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <SelectField
            label={`Experience in ${farmingShortName} Farming`}
            placeholder="Select experience"
            value={experience}
            options={EXPERIENCE_OPTIONS}
            onChange={setExperience}
          />

          <SelectField
            label="Farm Size"
            placeholder="Select farm size"
            value={farmSize}
            options={FARM_SIZE_OPTIONS}
            onChange={setFarmSize}
          />

          <View style={styles.group}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={17} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter your location"
                placeholderTextColor={colors.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <SelectField
            label="Purpose"
            placeholder="Select purpose"
            value={purpose}
            options={PURPOSE_OPTIONS}
            onChange={setPurpose}
          />

          <Pressable
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={styles.submitBtnText}>Submit Application</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.header,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 14,
    ...shadow,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginTop: 3,
    textAlign: "center",
  },
  form: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  group: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  required: {
    color: colors.red,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 46,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.header,
    height: 52,
    borderRadius: radius.pill,
    marginTop: 8,
    ...shadow,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
