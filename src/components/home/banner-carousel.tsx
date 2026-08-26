import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { colors, radius } from "@/lib/theme";
import { t } from "@/lib/home-translations";

const BANNER_HORIZONTAL_PADDING = 14;
// home1/2/3.png are all a native 16:7 aspect ratio.
const BANNER_ASPECT_RATIO = 16 / 7;

type BannerDef = {
  id: string;
  line1Key: "banner1Line1" | "banner2Line1" | "banner3Line1";
  line2Key: "banner1Line2" | "banner2Line2" | "banner3Line2";
  ctaKey: "banner1Cta" | "banner2Cta" | "banner3Cta";
  image: ImageSourcePropType;
  bgColor: string;
};

const banners: BannerDef[] = [
  {
    id: "1",
    line1Key: "banner1Line1",
    line2Key: "banner1Line2",
    ctaKey: "banner1Cta",
    image: require("../../../assets/home1.png"),
    bgColor: "#1e6040",
  },
  {
    id: "2",
    line1Key: "banner2Line1",
    line2Key: "banner2Line2",
    ctaKey: "banner2Cta",
    image: require("../../../assets/home2.png"),
    bgColor: "#1a237e",
  },
  {
    id: "3",
    line1Key: "banner3Line1",
    line2Key: "banner3Line2",
    ctaKey: "banner3Cta",
    image: require("../../../assets/home3.png"),
    bgColor: "#4e342e",
  },
];

type BannerCarouselProps = {
  locale: string | null;
  onCtaPress?: (bannerId: string) => void;
};

export function BannerCarousel({ locale, onCtaPress }: BannerCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const bannerHeight = (screenWidth - BANNER_HORIZONTAL_PADDING * 2) / BANNER_ASPECT_RATIO;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeIndex + 1) % banners.length;
      scrollRef.current?.scrollTo({ x: next * screenWidth, animated: true });
      setActiveIndex(next);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeIndex, screenWidth]);

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setActiveIndex(idx);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {banners.map((banner) => (
          <View key={banner.id} style={[styles.banner, { width: screenWidth, height: bannerHeight }]}>
            <View style={[styles.bannerInner, { backgroundColor: banner.bgColor }]}>
              <Image
                source={banner.image}
                style={styles.bannerImage}
                resizeMode="contain"
                fadeDuration={0}
              />
              <View style={styles.overlay} pointerEvents="none" />
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>{t(locale, banner.line1Key)}</Text>
                <Text style={styles.bannerTitle}>{t(locale, banner.line2Key)}</Text>
                <Pressable
                  style={styles.ctaBtn}
                  onPress={() => onCtaPress?.(banner.id)}
                >
                  <Text style={styles.ctaBtnText}>{t(locale, banner.ctaKey)}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {banners.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, idx === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    position: "relative",
  },
  banner: {
    paddingHorizontal: BANNER_HORIZONTAL_PADDING,
  },
  bannerInner: {
    flex: 1,
    borderRadius: 8, // small border radius as requested
    overflow: "hidden",
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  bannerContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 22,
    justifyContent: "flex-end",
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ctaBtn: {
    marginTop: 6,
    backgroundColor: colors.warning,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  ctaBtnText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  dotsRow: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    zIndex: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  dotActive: {
    backgroundColor: "#ffffff",
    width: 18,
  },
});
