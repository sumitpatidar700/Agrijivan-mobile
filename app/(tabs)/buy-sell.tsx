import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius } from "@/lib/theme";
import { useActiveFarming } from "@/lib/active-farming-context";
import { useAuth } from "@/lib/auth-context";
import { useTradePostsQuery } from "@/api/buy-sell";
import { PostCard } from "@/components/buy-sell/post-card";
import { PostTypeModal } from "@/components/buy-sell/post-type-modal";
import { PostKind } from "@/lib/trade-post-data";

export default function BuySellScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<PostKind>("buy");

  const { activeFarming, isLoading: farmingLoading } = useActiveFarming();
  const { data: posts, isLoading: postsLoading } = useTradePostsQuery(activeFarming?.id);

  const buyPosts = useMemo(() => (posts ?? []).filter((p) => p.kind === "buy"), [posts]);
  const sellPosts = useMemo(() => (posts ?? []).filter((p) => p.kind === "sell"), [posts]);
  const visiblePosts = activeTab === "buy" ? buyPosts : sellPosts;

  const farmingName = activeFarming?.name || "Farming";

  const openPostTypeModal = () => setModalVisible(true);

  const handleSelectPostType = (kind: PostKind) => {
    setModalVisible(false);
    if (!activeFarming) return;
    router.push({
      pathname: "/create-post",
      params: { type: kind, farmingItemId: activeFarming.id, farmingItemName: activeFarming.name },
    });
  };

  const isLoading = farmingLoading || postsLoading;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Header banner ─────────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Marketplace</Text>
              <Text style={styles.headerSubtitle}>Buy &amp; sell within the {farmingName.toLowerCase()} community</Text>
            </View>
            {!!user && (
              <Pressable
                style={styles.headerIconBtn}
                onPress={() => router.push("/my-trade-posts")}
                hitSlop={8}
              >
                <Ionicons name="time-outline" size={22} color="#fff" />
              </Pressable>
            )}
            {!!activeFarming && (
              <Pressable style={styles.headerAddBtn} onPress={openPostTypeModal} hitSlop={8}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.headerAddBtnText}>Create Post</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {!activeFarming && !farmingLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Select a farming type</Text>
              <Text style={styles.emptyDesc}>
                Choose an active farming from the sidebar to see and post buy/sell listings for it.
              </Text>
            </View>
          ) : isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              {/* ── Buy / Sell tab switcher ─────────────────── */}
              <View style={styles.tabRow}>
                <Pressable
                  style={[styles.tabBtn, activeTab === "buy" && styles.tabBtnActive]}
                  onPress={() => setActiveTab("buy")}
                >
                  <Ionicons name="cart" size={15} color={activeTab === "buy" ? "#fff" : colors.textMuted} />
                  <Text style={[styles.tabBtnText, activeTab === "buy" && styles.tabBtnTextActive]}>
                    Buy ({buyPosts.length})
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.tabBtn, activeTab === "sell" && styles.tabBtnActive]}
                  onPress={() => setActiveTab("sell")}
                >
                  <Ionicons name="pricetag" size={15} color={activeTab === "sell" ? "#fff" : colors.textMuted} />
                  <Text style={[styles.tabBtnText, activeTab === "sell" && styles.tabBtnTextActive]}>
                    Sell ({sellPosts.length})
                  </Text>
                </Pressable>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionSubtitle}>
                  {activeTab === "buy"
                    ? `Find quality ${farmingName.toLowerCase()} listings`
                    : `Sell your ${farmingName.toLowerCase()} produce or stock`}
                </Text>
              </View>

              {visiblePosts.length > 0 ? (
                <View style={styles.postsList}>
                  {visiblePosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </View>
              ) : (
                <View style={styles.sectionEmpty}>
                  <Text style={styles.sectionEmptyText}>
                    No {activeTab} posts yet for {farmingName.toLowerCase()}.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <PostTypeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleSelectPostType}
        farmingName={farmingName}
      />
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
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  headerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radius.pill,
    marginLeft: 10,
  },
  headerAddBtnText: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "700",
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 32,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: "#fff",
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  postsList: {
    gap: 14,
    marginBottom: 26,
  },
  sectionEmpty: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: 24,
    alignItems: "center",
    marginBottom: 26,
  },
  sectionEmptyText: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
