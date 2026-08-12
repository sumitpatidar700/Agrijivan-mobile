import { useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { colors, radius } from "@/lib/theme";
import { useActiveFarming } from "@/lib/active-farming-context";
import { useYoutubeVideosQuery } from "@/api";
import { VideoListCard, type VideoCardData } from "@/components/videos/video-list-card";
import { API_BASE_URL } from "@/lib/api-client";

const CHANNEL_URL = "https://www.youtube.com/@Agrijivanfarming";

function getYoutubeId(url: string): string | null {
  const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function VideoDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { activeFarming } = useActiveFarming();
  const { data: allVideos, isLoading } = useYoutubeVideosQuery();

  const [descExpanded, setDescExpanded] = useState(false);

  const video = useMemo(() => allVideos?.find((v) => v.id === id), [allVideos, id]);

  // Same active-farming scoping rule as the Videos tab list
  const relatedVideos = useMemo(() => {
    if (!allVideos || !video) return [];
    return allVideos
      .filter((v) => v.id !== video.id && (v.isGlobal || (activeFarming && v.itemIds.includes(activeFarming.id))))
      .slice(0, 6);
  }, [allVideos, video, activeFarming]);

  const relatedCards: VideoCardData[] = useMemo(
    () =>
      relatedVideos.map((v) => {
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
    [relatedVideos],
  );

  const handleOpenRelated = (relatedId: string) => {
    router.push({ pathname: "/(tabs)/video-details", params: { id: relatedId } });
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!video) {
    return (
      <View style={[styles.screen, styles.centered, { paddingHorizontal: 32 }]}>
        <Ionicons name="videocam-off-outline" size={48} color={colors.textMuted} />
        <Text style={styles.notFoundTitle}>Video Not Found</Text>
        <Text style={styles.notFoundDesc}>This video isn&apos;t available anymore or may have been removed.</Text>
        <Pressable style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const ytId = getYoutubeId(video.videoUrl);
  const playerUrl = ytId ? `${API_BASE_URL}/media/youtube-embed?id=${ytId}` : null;

  return (
    <View style={styles.screen}>
      <View style={[styles.safeAreaTop, { height: insets.top }]} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} bounces={false}>
        {/* Player */}
        <View style={styles.player}>
          {playerUrl ? (
            <WebView
              source={{ uri: playerUrl }}
              style={styles.playerFrame}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={["*"]}
              mixedContentMode="always"
              thirdPartyCookiesEnabled
              setSupportMultipleWindows={false}
              userAgent="Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              startInLoadingState
              renderLoading={() => (
                <View style={[styles.playerFrame, styles.centered]}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            />
          ) : (
            <View style={[styles.playerFrame, styles.centered]}>
              <Ionicons name="alert-circle-outline" size={32} color="#fff" />
              <Text style={{ color: "#fff", marginTop: 8, fontSize: 12 }}>Video link is invalid</Text>
            </View>
          )}

          <Pressable
            style={[styles.playerIconBtn, styles.backBtn, { top: 10 }]}
            onPress={() => router.replace("/(tabs)/farming")}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{video.title}</Text>

          {/* Actions */}
          <Pressable style={styles.watchBtn} onPress={() => Linking.openURL(video.videoUrl).catch(() => {})}>
            <Ionicons name="logo-youtube" size={20} color="#fff" />
            <Text style={styles.watchBtnText}>Watch on YouTube</Text>
          </Pressable>

          <View style={styles.divider} />

          {/* Channel */}
          <View style={styles.channelRow}>
            <View style={styles.channelAvatar}>
              <Ionicons name="leaf" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.channelName}>AgriJivan Farming</Text>
              <Text style={styles.channelSubs}>Official YouTube Channel</Text>
            </View>
            <Pressable style={styles.subscribeBtn} onPress={() => Linking.openURL(CHANNEL_URL).catch(() => {})}>
              <Text style={styles.subscribeBtnText}>Subscribe</Text>
            </Pressable>
          </View>

          {!!video.summary && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionHeading}>Description</Text>
              <Text style={styles.descriptionText} numberOfLines={descExpanded ? undefined : 3}>
                {video.summary}
              </Text>
              {video.summary.length > 140 && (
                <Pressable style={styles.showMoreBtn} onPress={() => setDescExpanded((v) => !v)}>
                  <Text style={styles.showMoreText}>{descExpanded ? "Show less" : "Show more"}</Text>
                  <Ionicons name={descExpanded ? "chevron-up" : "chevron-down"} size={14} color={colors.primary} />
                </Pressable>
              )}
            </>
          )}

          {relatedCards.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.sectionHeading, { color: colors.text }]}>More Videos</Text>
              <View style={styles.relatedList}>
                {relatedCards.map((related) => (
                  <VideoListCard
                    key={related.id}
                    video={related}
                    compact
                    onPress={() => handleOpenRelated(related.id)}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeAreaTop: {
    backgroundColor: "#000",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  notFoundTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginTop: 6,
  },
  notFoundDesc: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  goBackBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  goBackBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  scroll: {
    paddingBottom: 110,
  },
  player: {
    aspectRatio: 4 / 3,
    backgroundColor: "#000",
    position: "relative",
  },
  playerFrame: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  playerIconBtn: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    left: 12,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 24,
  },
  watchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.red,
  },
  watchBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  channelAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  channelName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  channelSubs: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  subscribeBtn: {
    backgroundColor: colors.red,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  subscribeBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  relatedList: {
    gap: 16,
  },
});
