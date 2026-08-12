import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { colors, radius, shadow } from "@/lib/theme";
import { LocationPickerMap, type PickedLocation } from "@/components/location/location-picker-map";
import {
  type Address,
  useAddressesQuery,
  useSaveAddressMutation,
  useSetDefaultAddressMutation,
  useDeleteAddressMutation,
} from "@/api/addresses";

export type { Address };

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userKey = user?.email || user?.phone || "guest";

  const { data: addresses = [], isLoading: loading } = useAddressesQuery(user?.id, userKey);
  const saveAddressMutation = useSaveAddressMutation();
  const setDefaultMutation = useSetDefaultAddressMutation();
  const deleteAddressMutation = useDeleteAddressMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenEdit = (addr: Address) => {
    setEditingAddressId(addr.id);
    setName(addr.name);
    setPhone(addr.phone);
    setVillage(addr.village);
    setCity(addr.city);
    setStateName(addr.state);
    setPinCode(addr.pinCode);
    setLatitude(addr.latitude);
    setLongitude(addr.longitude);
    setErrorMsg(null);
    setShowAddModal(true);
  };

  const handleOpenAdd = () => {
    setEditingAddressId(null);
    setName("");
    setPhone("");
    setVillage("");
    setCity("");
    setStateName("");
    setPinCode("");
    setLatitude(undefined);
    setLongitude(undefined);
    setErrorMsg(null);
    setShowAddModal(true);
  };

  const handleMapSelect = (location: PickedLocation) => {
    setShowMapPicker(false);
    setLatitude(location.latitude);
    setLongitude(location.longitude);
    if (location.village) setVillage(location.village);
    if (location.city) setCity(location.city);
    if (location.state) setStateName(location.state);
    if (location.pinCode) setPinCode(location.pinCode);
    setShowAddModal(true);
  };

  const handleMapClose = () => {
    setShowMapPicker(false);
    setShowAddModal(true);
  };

  const handleSaveAddress = async () => {
    if (!name || !phone || !village || !city || !stateName || !pinCode) {
      setErrorMsg("Please fill in all the fields.");
      return;
    }
    if (phone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      await saveAddressMutation.mutateAsync({
        id: editingAddressId ?? undefined,
        userId: user.id,
        name,
        phone,
        village,
        city,
        state: stateName,
        pinCode,
        latitude,
        longitude,
        isFirstAddress: addresses.length === 0,
      });

      // Reset Form & Close
      setName("");
      setPhone("");
      setVillage("");
      setCity("");
      setStateName("");
      setPinCode("");
      setLatitude(undefined);
      setLongitude(undefined);
      setEditingAddressId(null);
      setErrorMsg(null);
      setShowAddModal(false);
    } catch (err: any) {
      console.warn("Failed to save address:", err);
      setErrorMsg(err?.message || "Failed to save address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    try {
      await setDefaultMutation.mutateAsync({ userId: user.id, addressId: id });
    } catch (err) {
      console.warn(err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    try {
      const toDelete = addresses.find((addr) => addr.id === id);
      await deleteAddressMutation.mutateAsync({
        userId: user.id,
        addressId: id,
        wasDefault: Boolean(toDelete?.isDefault),
      });
    } catch (err) {
      console.warn(err);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top + 24 }]}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
            </Pressable>
            <Text style={styles.headerTitle}>Address</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.centered}>
            <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
            <Text style={styles.messageText}>Please sign in to manage your addresses.</Text>
            <Pressable style={styles.actionBtn} onPress={() => router.back()}>
              <Text style={styles.actionBtnText}>Go to Account</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top + 24 }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
          </Pressable>
          <Text style={styles.headerTitle}>Address</Text>
          <Pressable style={styles.addIconBtn} onPress={handleOpenAdd}>
            <Ionicons name="add" size={24} color={colors.textOnDark} />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Pressable style={styles.addNewCard} onPress={handleOpenAdd}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.addNewText}>Add New Address</Text>
          </Pressable>

          {addresses.map((addr) => (
            <View key={addr.id} style={[styles.addressCard, addr.isDefault && styles.defaultCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{addr.name}</Text>
                {addr.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                )}
              </View>

              <Text style={styles.detailLine}>{addr.village}</Text>
              <Text style={styles.detailLine}>
                {addr.city}, {addr.state} - {addr.pinCode}
              </Text>
              <Text style={styles.phoneLine}>📞 Phone: {addr.phone}</Text>

              <View style={styles.cardFooter}>
                {!addr.isDefault ? (
                  <Pressable style={styles.actionLink} onPress={() => handleSetDefault(addr.id)}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                    <Text style={styles.actionLinkText}>Set Default</Text>
                  </Pressable>
                ) : (
                  <View style={styles.actionLink}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={[styles.actionLinkText, { color: colors.primary }]}>Active</Text>
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 14 }}>
                  <Pressable style={styles.actionLink} onPress={() => handleOpenEdit(addr)}>
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <Text style={styles.actionLinkText}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.deleteLink} onPress={() => handleDeleteAddress(addr.id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.red} />
                    <Text style={styles.deleteLinkText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      </View>

      {/* Add Address Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddressId ? "Edit Address" : "Add New Address"}
              </Text>
              <Pressable onPress={() => setShowAddModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {errorMsg && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={colors.red} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Recipient Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <Pressable
                style={styles.mapPickBtn}
                onPress={() => {
                  // Close the address form Modal before opening the map Modal - two
                  // native Modals visible at once can silently fail to present.
                  setShowAddModal(false);
                  setShowMapPicker(true);
                }}
              >
                <Ionicons name="location" size={18} color={colors.primary} />
                <Text style={styles.mapPickBtnText}>
                  {latitude ? "Location Selected - Change on Map" : "Select Location on Map"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Village / Area / Street</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Village name or Area"
                  placeholderTextColor={colors.textMuted}
                  value={village}
                  onChangeText={setVillage}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>City / District</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Junagadh"
                  placeholderTextColor={colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Gujarat"
                  placeholderTextColor={colors.textMuted}
                  value={stateName}
                  onChangeText={setStateName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PIN Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit PIN code"
                  placeholderTextColor={colors.textMuted}
                  value={pinCode}
                  onChangeText={(text) => setPinCode(text.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </ScrollView>

            <Pressable
              style={[styles.submitBtn, saving && { opacity: 0.6 }]}
              onPress={handleSaveAddress}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.submitBtnText}>Save Address</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <LocationPickerMap
        visible={showMapPicker}
        onClose={handleMapClose}
        onSelect={handleMapSelect}
      />
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
    paddingHorizontal: 16,
    ...shadow,
  },
  headerRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    padding: 4,
  },
  addIconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textOnDark,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    overflow: "hidden",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  addNewCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
    gap: 8,
  },
  addNewText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  addressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  defaultCard: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  defaultBadge: {
    backgroundColor: "#e8f5e9",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
  },
  detailLine: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginVertical: 1,
  },
  phoneLine: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 12,
    paddingTop: 10,
  },
  actionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  deleteLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deleteLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.red,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
  },
  messageText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    fontWeight: "600",
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    ...shadow,
  },
  actionBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
    ...shadow,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  formContainer: {
    gap: 12,
    paddingBottom: 24,
  },
  inputGroup: {
    gap: 6,
  },
  mapPickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  mapPickBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    ...shadow,
  },
  submitBtnText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
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
});
