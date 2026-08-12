import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius, shadow } from "@/lib/theme";

export type OfferItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
};

const defaultOffers: OfferItem[] = [
  {
    id: "1",
    title: "Organic Wheat",
    subtitle: "Premium quality seeds",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80",
  },
  {
    id: "2",
    title: "Tomato Farm",
    subtitle: "Fresh harvest ready",
    image: "https://images.unsplash.com/photo-1592841773081-c600e9f11cab?w=400&q=80",
  },
  {
    id: "3",
    title: "Green Fields",
    subtitle: "Seasonal crops",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80",
  },
];

type OffersCarouselProps = {
  title?: string;
  items?: OfferItem[];
};

export function OffersCarousel({ title = "Best Offers", items = defaultOffers }: OffersCarouselProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.overlay}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 14,
  },
  card: {
    width: 200,
    height: 140,
    borderRadius: radius.md,
    overflow: "hidden",
    ...shadow,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  cardTitle: {
    color: colors.textOnDark,
    fontSize: 15,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: colors.textOnDarkMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
