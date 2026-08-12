import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadow } from "@/lib/theme";
import { SelectField } from "@/components/ui/select-field";
import { useAuth } from "@/lib/auth-context";
import { useActiveFarming } from "@/lib/active-farming-context";
import { useCreateTradePostMutation } from "@/api/buy-sell";
import { uploadImagesToStorage } from "@/lib/upload-image";
import {
  PostKind,
  STATE_DISTRICTS,
  STATE_OPTIONS,
  UNIT_OPTIONS,
} from "@/lib/trade-post-data";

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string; farmingItemId?: string; farmingItemName?: string }>();
  const kind: PostKind = params.type === "sell" ? "sell" : "buy";

  const { user } = useAuth();
  const { activeFarming } = useActiveFarming();
  const farmingItemId = params.farmingItemId || activeFarming?.id;
  const farmingItemName = params.farmingItemName || activeFarming?.name || "Farming";

  const createPost = useCreateTradePostMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [farmerName, setFarmerName] = useState((user?.user_metadata as any)?.name || "");
  const [contactNumber, setContactNumber] = useState(user?.phone || "");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const districtOptions = state ? STATE_DISTRICTS[state] || [] : [];

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 6 - photos.length,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, 6));
    }
  };

  const handleRemovePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const handleSubmit = async () => {
    if (!farmingItemId) {
      Alert.alert("Select a farming type", "Choose an active farming from the sidebar first.");
      return;
    }
    if (!title.trim() || !price.trim() || !contactNumber.trim() || !state || !district) {
      Alert.alert("Missing details", "Please fill in title, price, state, district and contact number.");
      return;
    }

    try {
      let uploadedPhotos: string[] = [];
      if (photos.length > 0) {
        setIsUploadingPhotos(true);
        uploadedPhotos = await uploadImagesToStorage(photos, `buy-sell/${farmingItemId}`);
        setIsUploadingPhotos(false);
      }

      await createPost.mutateAsync({
        farmingItemId,
        farmingItemName,
        kind,
        title: title.trim(),
        description: description.trim(),
        quantity: quantity.trim(),
        unit,
        price: price.trim(),
        state,
        district,
        village: village.trim(),
        contactNumber: contactNumber.trim(),
        farmerName: farmerName.trim() || "Agrijivan Farmer",
        photos: uploadedPhotos,
        userId: user?.id ?? null,
      });
      router.back();
    } catch (err: any) {
      setIsUploadingPhotos(false);
      Alert.alert("Couldn't post", err?.message || "Something went wrong. Please try again.");
    }
  };

  const isSubmitting = isUploadingPhotos || createPost.isPending;

  return (
    <View style={styles.screen}>
      {/* ── Header ────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {kind === "buy" ? "Create Buy Post" : "Create Sell Post"}
        </Text>
        <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.farmingBanner}>
            <Ionicons name="leaf" size={16} color={colors.primary} />
            <Text style={styles.farmingBannerText}>Posting under {farmingItemName}</Text>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={kind === "buy" ? "What are you looking to buy?" : "What are you selling?"}
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add breed, quality, condition, or any other details"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.group, { flex: 1 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 10"
                placeholderTextColor={colors.textMuted}
                value={quantity}
                onChangeText={(text) => setQuantity(text.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={[styles.group, { flex: 1 }]}>
              <SelectField
                label="Unit"
                placeholder="Select"
                value={unit}
                options={UNIT_OPTIONS}
                onChange={setUnit}
              />
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>
              Farmer Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={colors.textMuted}
              value={farmerName}
              onChangeText={setFarmerName}
            />
          </View>

          <SelectField
            label="State"
            required
            placeholder="Select State"
            value={state}
            options={STATE_OPTIONS}
            onChange={(value) => {
              setState(value);
              setDistrict("");
            }}
          />

          <SelectField
            label="District"
            required
            placeholder="Select District"
            value={district}
            options={districtOptions}
            onChange={setDistrict}
          />

          <View style={styles.group}>
            <Text style={styles.label}>Village</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your village"
              placeholderTextColor={colors.textMuted}
              value={village}
              onChangeText={setVillage}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>
              Contact Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter mobile number"
              placeholderTextColor={colors.textMuted}
              value={contactNumber}
              onChangeText={(text) => setContactNumber(text.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>
              Price / Budget <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount in ₹"
              placeholderTextColor={colors.textMuted}
              value={price}
              onChangeText={(text) => setPrice(text.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Add Photos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosRow}
            >
              <Pressable style={styles.addPhotoBtn} onPress={handlePickPhoto}>
                <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
                <Text style={styles.addPhotoText}>Tap to add{"\n"}photos</Text>
              </Pressable>
              {photos.map((uri) => (
                <View key={uri} style={styles.photoThumbWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <Pressable style={styles.removePhotoBtn} onPress={() => handleRemovePhoto(uri)}>
                    <Ionicons name="close" size={12} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>

          <Pressable
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={[styles.submitBtnText, { marginLeft: 8 }]}>
                  {isUploadingPhotos ? "Uploading photos..." : "Posting..."}
                </Text>
              </>
            ) : (
              <Text style={styles.submitBtnText}>Post Now</Text>
            )}
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
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 14,
    ...shadow,
  },
  headerIconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  form: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  farmingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(5,81,3,0.08)",
    borderWidth: 1,
    borderColor: "rgba(5,81,3,0.2)",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  farmingBannerText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.primary,
  },
  row: {
    flexDirection: "row",
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
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  photosRow: {
    gap: 10,
    paddingVertical: 2,
  },
  addPhotoBtn: {
    width: 78,
    height: 78,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 4,
  },
  addPhotoText: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 12,
  },
  photoThumbWrap: {
    width: 78,
    height: 78,
    borderRadius: radius.md,
    overflow: "visible",
  },
  photoThumb: {
    width: "100%",
    height: "100%",
    borderRadius: radius.md,
  },
  removePhotoBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtn: {
    backgroundColor: colors.header,
    height: 52,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    ...shadow,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
