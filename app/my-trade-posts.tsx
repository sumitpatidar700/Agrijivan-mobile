import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadow } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import {
  useMyTradePostsQuery,
  useSetTradePostPausedMutation,
  useDeleteTradePostMutation,
  type TradePost,
  type TradePostStatus,
} from "@/api/buy-sell";

const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&q=80";

type SortOption = "newest" | "oldest" | "price_high" | "price_low";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "price_low", label: "Price: Low to High" },
];

function formatPostedAt(iso: string) {
  const d = new Date(iso);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "long" }).toLowerCase();
  const year = d.getFullYear();
  return `${hours}:${minutes} ${ampm} ${day}/${month}/${year}`;
}

const STATUS_META: Record<TradePostStatus, { label: string; color: string; bg: string; desc: string }> = {
  pending: {
    label: "Pending Review",
    color: "#d97706",
    bg: "rgba(217,119,6,0.1)",
    desc: "Waiting for admin approval before it goes live.",
  },
  active: {
    label: "Live",
    color: colors.primary,
    bg: "rgba(5,81,3,0.08)",
    desc: "Visible to everyone in the marketplace.",
  },
  paused: {
    label: "Paused",
    color: colors.textMuted,
    bg: colors.background,
    desc: "Hidden from the marketplace until you resume it.",
  },
  rejected: {
    label: "Rejected",
    color: colors.red,
    bg: "rgba(220,38,38,0.08)",
    desc: "Not approved by admin. Contact support for details.",
  },
};

function PostRow({ post }: { post: TradePost }) {
  const meta = STATUS_META[post.status];
  const pauseMutation = useSetTradePostPausedMutation();
  const deleteMutation = useDeleteTradePostMutation();
  const canToggle = post.status === "active" || post.status === "paused";

  const handleToggle = () => {
    pauseMutation.mutate(
      { postId: post.id, paused: post.status === "active" },
      {
        onError: (err: any) => Alert.alert("Couldn't update", err?.message || "Please try again."),
      },
    );
  };

  const handleCancel = () => {
    Alert.alert("Cancel this post?", "This will withdraw your post before it's reviewed. This can't be undone.", [
      { text: "Keep Post", style: "cancel" },
      {
        text: "Cancel Post",
        style: "destructive",
        onPress: () => {
          deleteMutation.mutate(post.id, {
            onError: (err: any) => Alert.alert("Couldn't cancel", err?.message || "Please try again."),
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Image source={{ uri: post.photos[0] || FALLBACK_PHOTO }} style={styles.thumb} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.kindRow}>
            <Ionicons name={post.kind === "buy" ? "cart" : "pricetag"} size={12} color={colors.textMuted} />
            <Text style={styles.kindText}>{post.kind === "buy" ? "BUY" : "SELL"}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>
          <Text style={styles.price}>₹{post.price}</Text>
        </View>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
        <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
        <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
      </View>
      <Text style={styles.statusDesc}>{meta.desc}</Text>

      <Text style={styles.postedAt}>Posted on {formatPostedAt(post.createdAt)}</Text>

      {canToggle && (
        <Pressable
          style={[styles.toggleBtn, post.status === "active" ? styles.pauseBtn : styles.resumeBtn]}
          onPress={handleToggle}
          disabled={pauseMutation.isPending}
        >
          {pauseMutation.isPending ? (
            <ActivityIndicator color={post.status === "active" ? colors.red : "#fff"} size="small" />
          ) : (
            <>
              <Ionicons
                name={post.status === "active" ? "pause" : "play"}
                size={15}
                color={post.status === "active" ? colors.red : "#fff"}
              />
              <Text style={[styles.toggleBtnText, post.status === "active" && { color: colors.red }]}>
                {post.status === "active" ? "Pause Post" : "Resume Post"}
              </Text>
            </>
          )}
        </Pressable>
      )}

      {post.status === "pending" && (
        <Pressable style={styles.cancelBtn} onPress={handleCancel} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? (
            <ActivityIndicator color={colors.red} size="small" />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={15} color={colors.red} />
              <Text style={styles.cancelBtnText}>Cancel Post</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

export default function MyTradePostsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: posts, isLoading } = useMyTradePostsQuery(user?.id);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const hasAnyPosts = (posts ?? []).length > 0;

  const filteredSorted = useMemo(() => {
    const all = posts ?? [];
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? all.filter(
          (p) => p.title.toLowerCase().includes(query) || p.farmingItemName.toLowerCase().includes(query)
        )
      : all;

    const priceOf = (p: TradePost) => parseFloat(p.price) || 0;

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "price_high":
          return priceOf(b) - priceOf(a);
        case "price_low":
          return priceOf(a) - priceOf(b);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [posts, searchQuery, sortOption]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>My Buy/Sell Posts</Text>
        <View style={styles.headerIconBtn} />
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !hasAnyPosts ? (
          <View style={styles.centered}>
            <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyDesc}>Posts you create in Buy &amp; Sell will show up here.</Text>
          </View>
        ) : (
          <>
            <View style={styles.searchSortRow}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={17} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search your posts..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== "" && (
                  <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={17} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>
              <Pressable style={styles.sortBtn} onPress={() => setSortMenuOpen(true)}>
                <Ionicons name="swap-vertical" size={16} color={colors.primary} />
                <Text style={styles.sortBtnText}>Sort</Text>
              </Pressable>
            </View>

            {filteredSorted.length === 0 ? (
              <View style={styles.centered}>
                <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No matching posts</Text>
                <Text style={styles.emptyDesc}>Try a different search term.</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                {filteredSorted.map((post) => (
                  <PostRow key={post.id} post={post} />
                ))}
              </ScrollView>
            )}
          </>
        )}
      </View>

      <Modal visible={sortMenuOpen} transparent animationType="fade" onRequestClose={() => setSortMenuOpen(false)}>
        <Pressable style={styles.sortMenuOverlay} onPress={() => setSortMenuOpen(false)}>
          <View style={styles.sortMenuSheet}>
            <Text style={styles.sortMenuTitle}>Sort by</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={styles.sortMenuOption}
                onPress={() => {
                  setSortOption(opt.value);
                  setSortMenuOpen(false);
                }}
              >
                <Text
                  style={[styles.sortMenuOptionText, sortOption === opt.value && styles.sortMenuOptionTextActive]}
                >
                  {opt.label}
                </Text>
                {sortOption === opt.value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
    paddingBottom: 30,
    ...shadow,
  },
  headerIconBtn: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    overflow: "hidden",
  },
  searchSortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: colors.text,
    padding: 0,
    height: "100%",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sortBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  sortMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sortMenuSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sortMenuTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  sortMenuOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  sortMenuOptionText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  sortMenuOptionTextActive: {
    color: colors.primary,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 32,
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
  list: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    ...shadow,
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: "#eee",
  },
  kindRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  kindText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.textMuted,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginTop: 3,
  },
  price: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11.5,
    fontWeight: "800",
  },
  statusDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 6,
  },
  postedAt: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    fontWeight: "600",
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: radius.pill,
    marginTop: 12,
  },
  pauseBtn: {
    backgroundColor: "rgba(220,38,38,0.08)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.25)",
  },
  resumeBtn: {
    backgroundColor: colors.primary,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: radius.pill,
    marginTop: 8,
    backgroundColor: "rgba(220,38,38,0.06)",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.red,
  },
});
