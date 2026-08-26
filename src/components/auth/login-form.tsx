import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet } from "@/lib/api-client";
import { getSupabaseClient } from "@/lib/supabase/client";
import { colors, radius, shadow } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "./logo";

type LoginFormProps = {
  onSuccess?: () => void;
  isEmbedded?: boolean;
};

export function LoginForm({ onSuccess, isEmbedded = false }: LoginFormProps) {
  const { loginSimulated } = useAuth();
  const nameRef = React.useRef<TextInput>(null);
  const locationRef = React.useRef<TextInput>(null);
  const mobileRef = React.useRef<TextInput>(null);
  const emailRef = React.useRef<TextInput>(null);
  const passwordRef = React.useRef<TextInput>(null);
  const otpRef = React.useRef<TextInput>(null);

  const dismissAndBlur = () => {
    Keyboard.dismiss();
    nameRef.current?.blur();
    locationRef.current?.blur();
    mobileRef.current?.blur();
    emailRef.current?.blur();
    passwordRef.current?.blur();
    otpRef.current?.blur();
  };
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const otpRefs = React.useRef<(TextInput | null)[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [signInWithMobile, setSignInWithMobile] = useState(true);

  const supabase = getSupabaseClient();

  const fetchProfileByPhone = async (phone: string) => {
    return apiGet<any>(`/content/profiles/phone/${encodeURIComponent(phone)}`).catch(() => null);
  };

  const fetchProfileByEmail = async (userEmail: string) => {
    return apiGet<any>(`/content/profiles/email/${encodeURIComponent(userEmail)}`).catch(() => null);
  };

  const handleSendOtp = async () => {
    if (!mobile) {
      setErrorMsg("Please enter your mobile number.");
      return;
    }
    if (isSignUp && (!name || !location)) {
      setErrorMsg("Please enter your name and location.");
      return;
    }

    setOtpLoading(true);
    setErrorMsg(null);

    try {
      const formattedMobile = mobile.startsWith("+") ? mobile : `+91${mobile}`;

      if (!isSignUp) {
        let isRegistered = false;
        let registeredUser: any = null;

        const remoteProfile = await fetchProfileByPhone(formattedMobile);
        if (remoteProfile) {
          isRegistered = true;
          registeredUser = remoteProfile;
        }

        if (!isRegistered) {
          try {
            const localProfilesStr = await AsyncStorage.getItem("local_profiles");
            if (localProfilesStr) {
              const localProfiles = JSON.parse(localProfilesStr);
              const found = localProfiles.find((p: any) => p.phone === formattedMobile);
              if (found) {
                isRegistered = true;
                registeredUser = found;
              }
            }
          } catch (err) {
            console.warn("Local profiles lookup failed:", err);
          }
        }

        if (!isRegistered) {
          setErrorMsg("This mobile number is not registered. Please create an account first!");
          setOtpLoading(false);
          return;
        }

        setName(registeredUser.name || "");
        setLocation(registeredUser.location || "");
        setEmail(registeredUser.email || "");
      }

      if (isSignUp) {
        let alreadyRegistered = false;
        const remoteProfile = await fetchProfileByPhone(formattedMobile);
        if (remoteProfile) {
          alreadyRegistered = true;
        }

        if (!alreadyRegistered) {
          try {
            const localProfilesStr = await AsyncStorage.getItem("local_profiles");
            if (localProfilesStr) {
              const localProfiles = JSON.parse(localProfilesStr);
              if (localProfiles.some((p: any) => p.phone === formattedMobile)) {
                alreadyRegistered = true;
              }
            }
          } catch (err) {}
        }

        if (alreadyRegistered) {
          setErrorMsg("This mobile number is already registered. Please Sign In instead!");
          setOtpLoading(false);
          return;
        }
      }

      if (!supabase) {
        setErrorMsg("Database is not configured.");
        setOtpLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedMobile,
        options: isSignUp
          ? { shouldCreateUser: true, data: { name, phone: formattedMobile, role: "customer" } }
          : { shouldCreateUser: false },
      });

      if (error) {
        setErrorMsg(error.message || "Failed to send OTP.");
        setOtpLoading(false);
        return;
      }

      alert(`OTP code sent successfully to ${formattedMobile}!`);
      setOtpSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!otpSent) {
      setErrorMsg("Please click 'Send OTP' next to your mobile number first.");
      return;
    }

    if (!otp || otp.length < 6) {
      setErrorMsg("Please enter the 6-digit OTP code.");
      return;
    }

    if (!supabase) {
      setErrorMsg("Database is not configured.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp || (signInWithMobile && otpSent)) {
        const formattedMobile = mobile.startsWith("+") ? mobile : `+91${mobile}`;

        const { error: verifyError } = await supabase.auth.verifyOtp({
          phone: formattedMobile,
          token: otp,
          type: "sms",
        });

        if (verifyError) {
          console.error("[OTP verify] error:", verifyError);
          throw new Error(
            verifyError.message?.toLowerCase().includes("token")
              ? "Invalid OTP code. Please try again."
              : verifyError.message || "Invalid OTP code. Please try again."
          );
        }

        // verifyOtp establishes a real Supabase session directly (creating the
        // auth.users row + profiles row via the DB trigger for signups) -
        // auth-context.tsx's onAuthStateChange listener picks it up automatically.
        alert(isSignUp ? "Account created successfully! Welcome to AgriJivan." : "Account verified successfully! Welcome back to AgriJivan.");
        onSuccess?.();
      } else {
        if (signInWithMobile) {
          await handleSendOtp();
        } else {
          if (!email || !password) {
            setErrorMsg("Please fill in all fields.");
            setLoading(false);
            return;
          }
          let signedIn = false;
          if (supabase) {
            const { error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (!error) {
              signedIn = true;
            } else {
              console.warn("Supabase auth failed, running simulated fallback:", error.message);
            }
          }

          if (!signedIn) {
            let isRegistered = false;
            let registeredUser: any = null;

            const remoteProfile = await fetchProfileByEmail(email);
            if (remoteProfile) {
              isRegistered = true;
              registeredUser = remoteProfile;
            }

            if (!isRegistered) {
              try {
                const localProfilesStr = await AsyncStorage.getItem("local_profiles");
                if (localProfilesStr) {
                  const localProfiles = JSON.parse(localProfilesStr);
                  const found = localProfiles.find((p: any) => p.email === email);
                  if (found) {
                    isRegistered = true;
                    registeredUser = found;
                  }
                }
              } catch (err) {}
            }

            if (!isRegistered) {
              setErrorMsg("This email is not registered. Please create an account first!");
              setLoading(false);
              return;
            }

            await loginSimulated(email, registeredUser.phone || "", registeredUser.name || email.split("@")[0], registeredUser.location || "Advisory Hub");
          }
          onSuccess?.();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setOtpSent(false);
    setErrorMsg(null);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtp("");
  };

  const handleDigitChange = (value: string, index: number) => {
    if (value.length > 1) {
      const pasted = value.replace(/[^0-9]/g, "").slice(0, 6);
      const nextDigits = [...otpDigits];
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) {
          nextDigits[index + i] = pasted[i];
        }
      }
      setOtpDigits(nextDigits);
      setOtp(nextDigits.join(""));
      const targetFocus = Math.min(index + pasted.length, 5);
      otpRefs.current[targetFocus]?.focus();
      return;
    }

    const nextDigits = [...otpDigits];
    const cleanValue = value.replace(/[^0-9]/g, "");
    nextDigits[index] = cleanValue;
    setOtpDigits(nextDigits);
    setOtp(nextDigits.join(""));

    if (cleanValue && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const nextDigits = [...otpDigits];
        nextDigits[index - 1] = "";
        setOtpDigits(nextDigits);
        setOtp(nextDigits.join(""));
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  const renderFormContent = () => (
    <View style={isEmbedded ? { flex: 1, justifyContent: "space-between" } : styles.formCard}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          {!isEmbedded && (
            <View style={styles.logoBadge}>
              <Logo width={48} height={48} />
            </View>
          )}
          <Text style={styles.title}>{isSignUp ? "Create Account" : "Login"}</Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? "Sign up to start buying agriculture products & access farming guides"
              : "Sign in to access your orders and profile"
            }
          </Text>
        </View>

        {errorMsg && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color={colors.red} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {isSignUp && !otpSent && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Farmer Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                <TextInput
                  ref={nameRef}
                  style={styles.input}
                  placeholder="Enter Full Name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location or Village</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={18} color={colors.textMuted} />
                <TextInput
                  ref={locationRef}
                  style={styles.input}
                  placeholder="Village, City or State"
                  placeholderTextColor={colors.textMuted}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>
          </>
        )}

        {(isSignUp || signInWithMobile) && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.mobileRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Ionicons name="call-outline" size={18} color={colors.textMuted} />
                <Text style={styles.countryCodePrefix}>+91</Text>
                <TextInput
                  ref={mobileRef}
                  style={styles.input}
                  placeholder="10-digit Mobile Number"
                  placeholderTextColor={colors.textMuted}
                  value={mobile}
                  onChangeText={(text) => {
                    setMobile(text.replace(/[^0-9]/g, ""));
                    if (otpSent) {
                      setOtpSent(false);
                      setOtpDigits(["", "", "", "", "", ""]);
                      setOtp("");
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <Pressable
                style={[
                  styles.inlineSendBtn,
                  (otpLoading || mobile.length !== 10) && styles.inlineSendBtnDisabled,
                  otpSent && styles.inlineSendBtnSent
                ]}
                onPress={handleSendOtp}
                disabled={otpLoading || mobile.length !== 10}
              >
                {otpLoading ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.inlineSendBtnText}>
                    {otpSent ? "Resend" : "Send OTP"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter 6-Digit OTP Code</Text>
          <View style={styles.otpGrid}>
            {otpDigits.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(el) => { otpRefs.current[idx] = el; }}
                style={[
                  styles.otpBox,
                  focusedIndex === idx && styles.otpBoxFocused,
                  !otpSent && styles.otpBoxDisabled
                ]}
                value={digit}
                onChangeText={(val) => handleDigitChange(val, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                onFocus={() => setFocusedIndex(idx)}
                onBlur={() => setFocusedIndex(null)}
                keyboardType="numeric"
                maxLength={2}
                selectTextOnFocus
                editable={otpSent}
              />
            ))}
          </View>
        </View>

        <Pressable
          style={[
            styles.submitButton,
            (loading || !otpSent || otp.length !== 6) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={loading || !otpSent || otp.length !== 6}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isSignUp ? "Verify & Sign Up" : "Verify & Sign In"}
            </Text>
          )}
        </Pressable>
      </View>

      <Pressable style={styles.toggleBtn} onPress={handleToggleMode}>
        <Text style={styles.toggleText}>
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have account? Sign Up"
          }
        </Text>
      </Pressable>
    </View>
  );

  if (isEmbedded) {
    return renderFormContent();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={{ flex: 1, width: "100%", justifyContent: "center" }} onPress={dismissAndBlur}>
          {renderFormContent()}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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


