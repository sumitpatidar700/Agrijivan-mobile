import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, shadow } from "@/lib/theme";
import type { PostKind } from "@/lib/trade-post-data";

type PostTypeModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (kind: PostKind) => void;
  farmingName: string;
};

export function PostTypeModal({ visible, onClose, onSelect, farmingName }: PostTypeModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <Text style={styles.title}>Choose Post Type</Text>

          <Pressable style={styles.option} onPress={() => onSelect("buy")}>
            <View style={styles.iconWrap}>
              <Ionicons name="cart" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>I Want to{"\n"}BUY</Text>
              <Text style={styles.optionSubtitle}>Find quality {farmingName.toLowerCase()} listings nearby</Text>
            </View>
          </Pressable>

          <Pressable style={styles.option} onPress={() => onSelect("sell")}>
            <View style={styles.iconWrap}>
              <Ionicons name="pricetag" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>I Want to{"\n"}SELL</Text>
              <Text style={styles.optionSubtitle}>Sell your {farmingName.toLowerCase()} produce or stock</Text>
            </View>
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 22,
    ...shadow,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 18,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19,
  },
  optionSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 2,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
});
