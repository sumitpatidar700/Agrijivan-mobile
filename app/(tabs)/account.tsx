import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { CartBadge } from "@/components/ui/cart-badge";
import { colors, radius, shadow } from "@/lib/theme";

type MenuItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  action?: "rate";
};

const primaryMenuItems: MenuItem[] = [
  { title: "User Profile", icon: "person-outline", route: "/edit-profile" },
  { title: "My Orders", icon: "bag-outline", route: "/orders" },
  { title: "My eBooks", icon: "book-outline", route: "/my-ebooks" },
  { title: "Change Farming or Language Region", icon: "globe-outline", route: "/preferences" },
  { title: "Rate Us", icon: "star-outline", action: "rate" },
];

const policyMenuItems: MenuItem[] = [
  { title: "Privacy Policy", icon: "shield-checkmark-outline", route: "/legal?topic=privacy" },
  { title: "Shipping & Delivery Policy", icon: "car-outline", route: "/legal?topic=shipping" },
  { title: "Cancellation Policy", icon: "close-circle-outline", route: "/legal?topic=cancellation" },
  { title: "Return Policy", icon: "refresh-outline", route: "/legal?topic=return" },
  { title: "Contact Us", icon: "help-circle-outline", route: "/support" },
];

const appVersion = Constants.expoConfig?.version || "1.0.0";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { cartCount } = useCart();
  const [policiesOpen, setPoliciesOpen] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const userKey = user?.phone || user?.email || user?.id || "guest";

  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(`agrijivan-avatar-${userKey}`).then(setAvatarUri);
  }, [user, userKey]);

  const handleItemPress = (item: MenuItem) => {
    if (item.action === "rate") {
      alert("Thanks for your interest! Rating is coming soon.");
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  const saveAvatar = async (uri: string | null) => {
    setAvatarUri(uri);
    setAvatarMenuOpen(false);
    try {
      if (uri) {
        await AsyncStorage.setItem(`agrijivan-avatar-${userKey}`, uri);
      } else {
        await AsyncStorage.removeItem(`agrijivan-avatar-${userKey}`);
      }
    } catch (err) {
      console.warn("Failed to save profile photo:", err);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setAvatarMenuOpen(false);
      alert("Camera permission is required to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      saveAvatar(result.assets[0].uri);
    } else {
      setAvatarMenuOpen(false);
    }
  };

  const handleChoosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAvatarMenuOpen(false);
      alert("Photo library permission is required to choose a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      saveAvatar(result.assets[0].uri);
    } else {
      setAvatarMenuOpen(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={26} color="#fff" />
            </View>
            <Text style={styles.headerName}>Welcome, Farmer</Text>
          </View>
        </View>

        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.loginCard}>
              <Text style={styles.loginCardTitle}>Access AgriJivan Portal</Text>
              <Text style={styles.loginCardText}>
                Manage multiple delivery addresses, save land farms, calculate live item invoice breakdowns, and monitor orders.
              </Text>
              <Pressable style={styles.loginSubmitBtn} onPress={() => router.push("/login")}>
                <Text style={styles.loginSubmitBtnText}>Sign In / Register</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  const userDisplayName = user.user_metadata?.name || (user.email ? user.email.split("@")[0] : "Farmer");

  const renderRow = (item: MenuItem, isLast: boolean) => (
    <View key={item.title}>
      <Pressable
        style={({ pressed }) => [
          styles.menuItemRow,
          pressed && { backgroundColor: "rgba(41, 134, 89, 0.05)" },
        ]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIconBg}>
            <Ionicons name={item.icon} size={20} color={colors.primary} />
          </View>
          <Text style={styles.menuItemTitle}>{item.title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      {!isLast && <View style={styles.menuDivider} />}
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={26} color="#fff" />
                )}
              </View>
              <Pressable style={styles.avatarEditBadge} onPress={() => setAvatarMenuOpen(true)}>
                <Ionicons name="camera" size={12} color={colors.primary} />
              </Pressable>
            </View>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerName}>{userDisplayName}</Text>
              {!!user.phone && <Text style={styles.headerPhone}>{user.phone}</Text>}
            </View>
          </View>
          <View style={styles.headerIcons}>
            <Pressable
              style={styles.headerIconBtn}
              onPress={() => alert("Wishlist is coming soon.")}
            >
              <Ionicons name="heart-outline" size={22} color="#fff" />
            </Pressable>
            <Pressable style={styles.headerIconBtn} onPress={() => router.push("/cart")}>
              <Ionicons name="bag-outline" size={22} color="#fff" />
              <CartBadge count={cartCount} />
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        visible={avatarMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarMenuOpen(false)}
      >
        <Pressable style={styles.avatarMenuOverlay} onPress={() => setAvatarMenuOpen(false)}>
          <View style={styles.avatarMenuSheet}>
            <Text style={styles.avatarMenuTitle}>Profile Photo</Text>
            <Pressable style={styles.avatarMenuOption} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={20} color={colors.text} />
              <Text style={styles.avatarMenuOptionText}>Take Photo</Text>
            </Pressable>
            <Pressable style={styles.avatarMenuOption} onPress={handleChoosePhoto}>
              <Ionicons name="image-outline" size={20} color={colors.text} />
              <Text style={styles.avatarMenuOptionText}>Choose from Gallery</Text>
            </Pressable>
            {avatarUri && (
              <Pressable style={styles.avatarMenuOption} onPress={() => saveAvatar(null)}>
                <Ionicons name="trash-outline" size={20} color={colors.red} />
                <Text style={[styles.avatarMenuOptionText, { color: colors.red }]}>Remove Photo</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>

      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.menuGroupList}>
            {primaryMenuItems.map((item, index) => renderRow(item, index === primaryMenuItems.length - 1))}
          </View>

          <View style={styles.menuGroupList}>
            <Pressable
              style={styles.sectionHeaderRow}
              onPress={() => setPoliciesOpen((open) => !open)}
            >
              <Text style={styles.sectionHeaderTitle}>Policies & Support</Text>
              <Ionicons
                name={policiesOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.primary}
              />
            </Pressable>
            {policiesOpen &&
              policyMenuItems.map((item, index) => renderRow(item, index === policyMenuItems.length - 1))}
          </View>

          <Pressable style={styles.signOutCard} onPress={() => logout()}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconBg}>
                <Ionicons name="log-out-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.signOutText}>Sign Out</Text>
            </View>
            <Text style={styles.versionText}>Version {appVersion}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: colors.header,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarWrap: { position: "relative" },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: colors.header,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextBlock: { flexShrink: 1 },
  headerName: { fontSize: 19, fontWeight: "800", color: "#fff", flexShrink: 1 },
  headerPhone: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "600", marginTop: 2 },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 18 },
  headerIconBtn: { position: "relative" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 20 },
  menuGroupList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    ...shadow,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  sectionHeaderTitle: { fontSize: 15, fontWeight: "800", color: colors.primary },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  menuDivider: { height: 1, backgroundColor: colors.border, marginLeft: 74 },
  signOutCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadow,
  },
  signOutText: { fontSize: 14, fontWeight: "800", color: colors.primary },
  versionText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  loginCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    ...shadow,
  },
  loginCardTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 6 },
  loginCardText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  loginSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    ...shadow,
  },
  loginSubmitBtnText: { color: colors.surface, fontSize: 13, fontWeight: "800" },
  avatarMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  avatarMenuSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    ...shadow,
  },
  avatarMenuTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  avatarMenuOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  avatarMenuOptionText: { fontSize: 14, fontWeight: "700", color: colors.text },
});
