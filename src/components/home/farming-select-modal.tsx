import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius, shadow } from "@/lib/theme";
import { useActiveFarming } from "@/lib/active-farming-context";

type FarmingSelectModalProps = {
  visible: boolean;
  onClose: () => void;
  locale: string | null;
};

export function FarmingSelectModal({ visible, onClose, locale }: FarmingSelectModalProps) {
  const { activeFarming, setActiveFarmingId, catalog: sortedCategories } = useActiveFarming();
  const [selectedFarmingId, setSelectedFarmingId] = useState<string | null>(activeFarming?.id ?? null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string | null>(null);

  // Sync draft selection with the active farming (and jump to whichever category tab
  // the active farming belongs to) whenever the modal opens
  useEffect(() => {
    if (visible) {
      setSelectedFarmingId(activeFarming?.id ?? null);
      const ownerCategory = activeFarming
        ? sortedCategories.find(
            (c) => c.slug === activeFarming.categorySlug || c.items?.some((item) => item.id === activeFarming.id),
          )
        : null;
      setActiveCategoryTab(ownerCategory?.id ?? sortedCategories[0]?.id ?? null);
    }
  }, [visible]);

  const selectedCategoryObj = sortedCategories.find((c) => c.id === activeCategoryTab) || sortedCategories[0];

  const handleOkPress = () => {
    if (selectedFarmingId) {
      setActiveFarmingId(selectedFarmingId);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {locale === "hi" ? "खेती का चयन करें" : "Select Farming Type"}
          </Text>
          {/* Category selection row (3 columns, text wraps) */}
          <View style={styles.modalTabsContainer}>
            <View style={styles.modalTabsRow}>
              {sortedCategories.map((category) => {
                const isSelected = category.id === activeCategoryTab;
                // Strip the word "Farming" (case-insensitive) from category display name
                const cleanName = category.name.replace(/\s*Farming\s*/gi, "").trim();

                return (
                  <Pressable
                    key={category.id}
                    style={[styles.modalTab, isSelected && styles.modalTabActive]}
                    onPress={() => setActiveCategoryTab(category.id)}
                  >
                    <Text style={[styles.modalTabText, isSelected && styles.modalTabTextActive]}>
                      {cleanName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Selected Category Items List (2-column Grid) */}
          <ScrollView style={{ flex: 1, marginTop: 10 }} showsVerticalScrollIndicator={false}>
            {!selectedCategoryObj?.items || selectedCategoryObj.items.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <Ionicons name="information-circle-outline" size={36} color={colors.textMuted} />
                <Text style={styles.modalEmptyText}>
                  {locale === "hi"
                    ? "इस श्रेणी के अंतर्गत अभी कोई खेती गाइड उपलब्ध नहीं है।"
                    : "No farming guides available under this category yet."}
                </Text>
              </View>
            ) : (
              <View style={styles.modalGrid}>
                {selectedCategoryObj.items.map((item: any) => {
                  const label = item.name;
                  const isSelected = item.id === selectedFarmingId;

                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.modalGridItem, isSelected && styles.modalGridItemSelected]}
                      onPress={() => setSelectedFarmingId(item.id)}
                    >
                      {/* Card Image Cover */}
                      <View style={styles.modalGridItemImageWrap}>
                        {item.image ? (
                          <Image source={{ uri: item.image }} style={styles.modalGridItemImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.modalGridItemPlaceholder}>
                            <Ionicons name="leaf" size={24} color={colors.primary} />
                          </View>
                        )}

                        {/* Selected overlay checkmark circle */}
                        {isSelected && (
                          <View style={styles.modalGridItemBadge}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                        )}
                      </View>

                      {/* Card Label */}
                      <Text
                        numberOfLines={1}
                        style={[styles.modalGridItemText, isSelected && styles.modalGridItemTextSelected]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Modal Bottom Actions Row */}
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>{locale === "hi" ? "रद्द करें" : "Cancel"}</Text>
            </Pressable>
            <Pressable style={styles.okBtn} onPress={handleOkPress}>
              <Text style={styles.okBtnText}>{locale === "hi" ? "ठीक है" : "OK"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    height: 560, // Increased fixed height so the modal size never changes!
    backgroundColor: "#fff",
    borderRadius: radius.md,
    padding: 20,
    ...shadow,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  modalTabsContainer: {
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  modalTabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    width: "100%",
  },
  modalTab: {
    flex: 1,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f4f6f4",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  modalTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalTabText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 14,
  },
  modalTabTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    columnGap: 10,
    paddingBottom: 20,
    paddingHorizontal: 2,
  },
  modalGridItem: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 6,
    alignItems: "center",
    ...shadow,
    elevation: 1,
  },
  modalGridItemSelected: {
    borderColor: colors.primary,
    backgroundColor: "#f4fcf7",
  },
  modalGridItemImageWrap: {
    width: "100%",
    height: 95,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f4f6f4",
    marginBottom: 6,
  },
  modalGridItemImage: {
    width: "100%",
    height: "100%",
  },
  modalGridItemPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8f5e9",
  },
  modalGridItemBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
    elevation: 2,
  },
  modalGridItemText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    width: "100%",
    paddingVertical: 2,
  },
  modalGridItemTextSelected: {
    color: colors.primary,
    fontWeight: "800",
  },
  modalEmptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
    gap: 12,
  },
  modalEmptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMuted,
  },
  okBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  okBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
});
