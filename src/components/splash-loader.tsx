import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/lib/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// All vertical layout is computed in pixels from SCREEN_HEIGHT (not mixed %/px) so the
// SVG wave and the panel beneath it always line up exactly, regardless of device size.
const HERO_TEXT_HEIGHT = SCREEN_HEIGHT * 0.42;
const PHOTO_TOP = SCREEN_HEIGHT * 0.4;
const PHOTO_HEIGHT = SCREEN_HEIGHT * 0.26;
const WAVE_TOP = SCREEN_HEIGHT * 0.63;

const FARM_IMAGE =
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80";

const LOADING_LINES = [
  "Loading a better tomorrow...",
  "Planting the seeds of success...",
  "Cultivating your experience...",
  "Growing something great...",
  "Harvesting fresh ideas...",
];

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "leaf", label: "Quality\nProducts" },
  { icon: "book", label: "Expert\nGuidance" },
  { icon: "cart", label: "Farm\nEssentials" },
  { icon: "shield-checkmark", label: "Trusted by\nFarmers" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Wave curve: two stacked paths so a thin lighter-green "rim" shows along the top edge
// of the dark panel, matching the highlighted curve in the reference design.
const WAVE_HEIGHT = 90;
const waveD = `M0,18 Q${SCREEN_WIDTH * 0.5},${WAVE_HEIGHT} ${SCREEN_WIDTH},22 L${SCREEN_WIDTH},${WAVE_HEIGHT} L0,${WAVE_HEIGHT} Z`;
const waveRimD = `M0,10 Q${SCREEN_WIDTH * 0.5},${WAVE_HEIGHT - 6} ${SCREEN_WIDTH},14 L${SCREEN_WIDTH},${WAVE_HEIGHT} L0,${WAVE_HEIGHT} Z`;

/** Rich, branded splash - only safe to render once fonts (incl. the icon font) are loaded. */
export function SplashLoader() {
  const [loadingLine] = useState(() => pick(LOADING_LINES));
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 2200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["8%", "78%"] });

  return (
    <View style={styles.screen}>
      {/* Sky gradient */}
      <LinearGradient
        colors={["#fdf8ef", "#fbead2"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Farm photo emerging from the sky */}
      <View style={styles.photoWrap}>
        <Image source={{ uri: FARM_IMAGE }} style={styles.photo} resizeMode="cover" />
        <LinearGradient
          colors={["#fdf8ef", "rgba(253,248,239,0)"]}
          style={styles.photoFade}
        />
      </View>

      {/* Floating leaves */}
      <Ionicons name="leaf" size={16} color="rgba(76,175,80,0.5)" style={[styles.floatLeaf, { top: 46, right: 26, transform: [{ rotate: "20deg" }] }]} />
      <Ionicons name="leaf" size={14} color="rgba(76,175,80,0.4)" style={[styles.floatLeaf, { top: "34%", left: 20, transform: [{ rotate: "-25deg" }] }]} />
      <Ionicons name="leaf" size={15} color="rgba(76,175,80,0.4)" style={[styles.floatLeaf, { top: "46%", right: 34, transform: [{ rotate: "10deg" }] }]} />

      {/* Hero text content */}
      <View style={styles.heroContent}>
        <View style={styles.logoMark}>
          <Image source={require("../../assets/icon.png")} style={styles.logoImage} resizeMode="contain" />
        </View>

        <Text style={styles.appName}>
          <Text style={{ color: colors.header }}>Agri</Text>
          <Text style={{ color: colors.primaryLight }}>Jivan</Text>
        </Text>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Ionicons name="leaf" size={13} color={colors.primaryLight} style={{ marginHorizontal: 8 }} />
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.taglineMain}>Grow Better. Live Better.</Text>
        <Text style={styles.taglineSub}>Your Trusted Partner in Modern Farming</Text>
      </View>

      {/* Wave transition into the dark panel */}
      <View style={styles.waveWrap}>
        <Svg width={SCREEN_WIDTH} height={WAVE_HEIGHT} viewBox={`0 0 ${SCREEN_WIDTH} ${WAVE_HEIGHT}`}>
          <Path d={waveRimD} fill={colors.primaryLight} />
          <Path d={waveD} fill={colors.header} />
        </Svg>
      </View>

      {/* Dark panel: features + loading */}
      <View style={styles.panel}>
        <View style={styles.featuresRow}>
          {FEATURES.map((f, i) => (
            <View key={f.label} style={styles.featureItemRow}>
              <View style={styles.featureItem}>
                <View style={styles.featureIconCircle}>
                  <Ionicons name={f.icon} size={22} color="#ffffff" />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
              {i < FEATURES.length - 1 && <View style={styles.featureDivider} />}
            </View>
          ))}
        </View>

        <View style={styles.loadingBlock}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLineDark} />
            <Ionicons name="leaf" size={13} color="#ffffff" style={{ marginHorizontal: 8 }} />
            <View style={styles.dividerLineDark} />
          </View>
          <Text style={styles.loadingText}>{loadingLine}</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: barWidth }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Minimal, font-independent splash shown only while the icon/custom fonts themselves
 * are still loading (RootLayout's `!fontsLoaded` gate). SplashLoader above uses Ionicons
 * glyphs, which come from their own font - rendering it *during* the font-load gate would
 * show blank/invisible icons. This has no font dependency at all, so it's always safe.
 */
export function MinimalSplash() {
  return (
    <View style={[styles.screen, { backgroundColor: colors.header, alignItems: "center", justifyContent: "center" }]}>
      <Text style={styles.minimalAppName}>AgriJivan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fdf8ef",
  },
  minimalAppName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },

  photoWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: PHOTO_TOP,
    height: PHOTO_HEIGHT,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
  },
  photoFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "45%",
  },

  floatLeaf: {
    position: "absolute",
  },

  heroContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HERO_TEXT_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  logoMark: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginBottom: 12,
    ...({
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 6,
    } as object),
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  dividerLine: {
    width: 44,
    height: 1,
    backgroundColor: "rgba(5,81,3,0.25)",
  },
  dividerLineDark: {
    width: 38,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  taglineMain: {
    fontSize: 16.5,
    fontWeight: "800",
    color: colors.header,
    textAlign: "center",
  },
  taglineSub: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },

  waveWrap: {
    position: "absolute",
    top: WAVE_TOP,
    left: 0,
    right: 0,
  },

  panel: {
    position: "absolute",
    // Starts partway into the SVG's own height so it always meets the wave's solid
    // fill (same colors.header) with no gap or overlap, regardless of screen size.
    top: WAVE_TOP + WAVE_HEIGHT * 0.7,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.header,
    paddingTop: 28,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },

  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  featureItemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureItem: {
    alignItems: "center",
    width: 66,
  },
  featureIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 15,
  },
  featureDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 4,
  },

  loadingBlock: {
    alignItems: "center",
    paddingBottom: 44,
  },
  loadingText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 14,
  },
  progressTrack: {
    width: 200,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
});
