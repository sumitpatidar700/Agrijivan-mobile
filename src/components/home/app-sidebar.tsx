import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { colors, radius, shadow } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { useActiveFarming } from "@/lib/active-farming-context";
import { FarmingSelectModal } from "@/components/home/farming-select-modal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(300, SCREEN_WIDTH * 0.8);

type SidebarItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  action?: "farming" | "logout";
};

const menuItems: SidebarItem[] = [
  { title: "Switch Farming", icon: "leaf-outline", action: "farming" },
  { title: "My Orders", icon: "bag-outline", route: "/orders" },
  { title: "Shopping Cart", icon: "cart-outline", route: "/cart" },
  { title: "Addresses", icon: "location-outline", route: "/addresses" },
  { title: "Help & Support", icon: "help-circle-outline", route: "/support" },
];

type AppSidebarProps = {
  visible: boolean;
  onClose: () => void;
  locale: string | null;
};

export function AppSidebar({ visible, onClose, locale }: AppSidebarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activeFarming } = useActiveFarming();
  const [modalVisible, setModalVisible] = useState(false);
  const [farmingModalOpen, setFarmingModalOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const pendingFarmingModal = useRef(false);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateX, { toValue: -SIDEBAR_WIDTH, duration: 220, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) {
            setModalVisible(false);
            // Only ever open the farming-picker Modal once the sidebar's own Modal
            // has fully unmounted - two React Native Modals stacked at once (this
            // one still closing + the picker opening) can freeze the UI, especially
            // on Android.
            if (pendingFarmingModal.current) {
              pendingFarmingModal.current = false;
              setFarmingModalOpen(true);
            }
          }
        },
      );
    }
  }, [visible]);

  const userDisplayName = user?.user_metadata?.name || (user?.email ? user.email.split("@")[0] : "Farmer");

  const handleItemPress = (item: SidebarItem) => {
    if (item.action === "farming") {
      pendingFarmingModal.current = true;
      onClose();
      return;
    }
    if (item.route) {
      onClose();
      router.push(item.route as any);
    }
  };

  const handleSignOut = () => {
    onClose();
    logout();
  };

  return (
    <>
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose}>
        <View style={styles.root}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <Animated.View
            style={[
              styles.panel,
              { width: SIDEBAR_WIDTH, paddingTop: insets.top + 20, transform: [{ translateX }] },
            ]}
          >
            {/* Profile block */}
            <View style={styles.profileBlock}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={26} color="#fff" />
              </View>
              <Text style={styles.userName} numberOfLines={1}>
                {user ? userDisplayName : "Welcome, Farmer"}
              </Text>
              {user ? (
                <Pressable onPress={() => { onClose(); router.push("/(tabs)/account"); }}>
                  <Text style={styles.profileLink}>View Profile</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => { onClose(); router.push("/login"); }}>
                  <Text style={styles.profileLink}>Sign In</Text>
                </Pressable>
              )}
            </View>

            {/* Active farming chip */}
            {activeFarming && (
              <View style={styles.activeFarmingChip}>
                <Ionicons name="leaf" size={14} color={colors.primary} />
                <Text style={styles.activeFarmingText} numberOfLines={1}>
                  {activeFarming.name}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            {/* Menu list */}
            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <Pressable
                  key={item.title}
                  style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
                  onPress={() => handleItemPress(item)}
                >
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                  <Text style={styles.menuRowText}>{item.title}</Text>
                </Pressable>
              ))}
            </View>

            {user && (
              <Pressable style={styles.signOutRow} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color={colors.red} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      </Modal>

      <FarmingSelectModal
        visible={farmingModalOpen}
        onClose={() => setFarmingModalOpen(false)}
        locale={locale}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    ...shadow,
  },
  profileBlock: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.header,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  userName: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  profileLink: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 2,
  },
  activeFarmingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 4,
  },
  activeFarmingText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    maxWidth: SIDEBAR_WIDTH - 80,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  menuList: {
    flex: 1,
    gap: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
  },
  menuRowPressed: {
    backgroundColor: "rgba(41, 134, 89, 0.05)",
  },
  menuRowText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 20,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.red,
  },
});
