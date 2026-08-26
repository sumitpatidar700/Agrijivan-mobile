import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadow } from "@/lib/theme";
import { useActiveFarming } from "@/lib/active-farming-context";
import { useYoutubeVideosQuery } from "@/api";
import { VideoListCard, type VideoCardData } from "@/components/videos/video-list-card";
import { DUMMY_VIDEOS } from "@/lib/coming-soon-data";

// Used only if no farming is selected yet / the active farming has no image of its own.
const FALLBACK_HEADER_IMAGE =
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&q=80";

type SortKey = "newest" | "az" | "za";
const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "az", label: "Title A-Z" },
  { id: "za", label: "Title Z-A" },
];

function getYoutubeId(url: string): string | null {
  const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function FarmingVideosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeFarming } = useActiveFarming();
  const { data: allVideos, isLoading } = useYoutubeVideosQuery();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = useState(false);

  const farmingName = activeFarming?.name || "Farming";

  // Only videos scoped to the currently active farming item (or marked global)
  const farmingVideos = useMemo(() => {
    if (!allVideos) return [];
    return allVideos.filter((v) => v.isGlobal || (activeFarming && v.itemIds.includes(activeFarming.id)));
  }, [allVideos, activeFarming]);

  const cards: VideoCardData[] = useMemo(
    () =>
      farmingVideos.map((v) => {
        const ytId = getYoutubeId(v.videoUrl);
        return {
          id: v.id,
          title: v.title,
          summary: v.summary,
          category: v.category,
          isPaid: v.isPaid,
          thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null,
        };
      }),
    [farmingVideos],
  );

  // No real videos for this farming type yet -> show clearly-labeled "Coming
  // Soon" placeholders instead of an empty page.
  const displayCards = cards.length > 0 ? cards : DUMMY_VIDEOS;

  // Filter chips are built from whatever categories actually exist for this farming's
  // videos - not a hardcoded list, since categories are freeform (set by the admin).
  const filters = useMemo(() => {
    const unique = Array.from(new Set(displayCards.map((c) => c.category).filter(Boolean))) as string[];
    return [{ id: "all", label: "All" }, ...unique.sort().map((c) => ({ id: c, label: c }))];
  }, [displayCards]);

  const filteredVideos = useMemo(() => {
    let result = activeFilter === "all" ? displayCards : displayCards.filter((c) => c.category === activeFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.summary ? c.summary.toLowerCase().includes(q) : false),
      );
    }

    if (sortKey !== "newest") {
      result = [...result].sort((a, b) =>
        sortKey === "az" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title),
      );
    }
    return result;
  }, [displayCards, activeFilter, search, sortKey]);

  const handleOpenVideo = (video: VideoCardData) => {
    if (video.comingSoon) {
      Alert.alert("Coming Soon", "Videos for this farming type aren't live yet - check back soon!");
      return;
    }
    router.push({ pathname: "/(tabs)/video-details", params: { id: video.id } });
  };

  return (
    <View style={styles.screen}>
      {/* Header - full-bleed photo of the active farming, same image used in the
          farming-selector, with a color layer so the title stays readable. */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Image
          source={{ uri: activeFarming?.image || FALLBACK_HEADER_IMAGE }}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay} />

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{farmingName} Videos</Text>
            <Text style={styles.headerSubtitle}>Learn {farmingName}</Text>
          </View>
        </View>
      </View>

      {/* Rounded content shell - fixed in place, only the scroll area inside it moves */}
      <View style={styles.content}>
        <Modal
          visible={sortOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setSortOpen(false)}
        >
          <Pressable style={styles.sortOverlay} onPress={() => setSortOpen(false)}>
            <View style={styles.sortMenu}>
              {SORT_OPTIONS.map((option) => {
                const isActive = option.id === sortKey;
                return (
                  <Pressable
                    key={option.id}
                    style={styles.sortOption}
                    onPress={() => {
                      setSortKey(option.id);
                      setSortOpen(false);
                    }}
                  >
                    <Text style={[styles.sortOptionText, isActive && styles.sortOptionTextActive]}>
                      {option.label}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Modal>

        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {/* Search + sort - scrolls together with the cards below */}
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput
                  placeholder="Search videos..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>

              <Pressable style={styles.sortButton} onPress={() => setSortOpen(true)}>
                <Ionicons name="swap-vertical" size={18} color={colors.text} />
              </Pressable>
            </View>

            {/* Filter chips */}
            {filters.length > 1 && (
              <View style={styles.filterRow}>
                {filters.map((filter) => {
                  const isActive = filter.id === activeFilter;
                  return (
                    <Pressable
                      key={filter.id}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setActiveFilter(filter.id)}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                        {filter.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {filteredVideos.map((video) => (
              <VideoListCard key={video.id} video={video} onPress={() => handleOpenVideo(video)} />
            ))}
            {filteredVideos.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="videocam-outline" size={56} color={colors.textMuted} />
                <Text style={styles.emptyText}>
                  {search.trim() ? "No videos match your search" : "No videos in this category"}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
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
    paddingHorizontal: 20,
    paddingBottom: 34,
    overflow: "hidden",
    position: "relative",
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.header,
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    marginTop: 3,
  },
  content: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    overflow: "hidden",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  sortOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "flex-end",
    paddingTop: 120,
    paddingRight: 16,
  },
  sortMenu: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 6,
    minWidth: 170,
    ...shadow,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  list: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 100,
    gap: 18,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 30,
  },
});
