// Placeholder "Coming Soon" content shown only when a farming type has no real
// data yet for a given section (books/equipment/medicine/feed/videos/buy-sell).
// Every item is clearly labeled and non-interactive (tapping shows a "Coming
// Soon" notice instead of navigating anywhere or contacting a real number) -
// this is never presented as real inventory, listings, or transactions.

import type { HomeProduct } from "@/components/home/product-section";
import type { VideoCardData } from "@/components/videos/video-list-card";
import type { TradePost } from "@/api/buy-sell";

const PLACEHOLDER_BOOK_IMAGE = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80";
const PLACEHOLDER_EQUIPMENT_IMAGE = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&q=80";
const PLACEHOLDER_MEDICINE_IMAGE = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80";
const PLACEHOLDER_FEED_IMAGE = "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=300&q=80";
const PLACEHOLDER_VIDEO_THUMB = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&q=80";
const PLACEHOLDER_POST_PHOTO = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&q=80";

function comingSoonProduct(id: string, name: string, image: string): HomeProduct {
  return {
    id,
    name,
    image,
    rating: 0,
    reviewCount: 0,
    price: 0,
    originalPrice: 0,
    comingSoon: true,
  };
}

export const DUMMY_BOOKS: HomeProduct[] = [
  {
    id: "dummy-book-1",
    nameKey: "book1",
    name: "पिग फार्मिंग ट्रेनिंग कोर्स बुक",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
    rating: 4.8,
    reviewCount: 156,
    price: 899,
    originalPrice: 1299,
    badgeKey: "badgeBestseller", // Red bestseller badge
  },
  {
    id: "dummy-book-2",
    nameKey: "book2",
    name: "पिग फीड फॉर्मुलेशन बुक",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    rating: 4.7,
    reviewCount: 89,
    price: 649,
    originalPrice: 899,
    badgeKey: "badgeFeatured", // Blue featured badge
  },
  {
    id: "dummy-book-3",
    nameKey: "book3",
    name: "पिग हेल्थ मैनेजमेंट गाइड",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80",
    rating: 4.9,
    reviewCount: 234,
    price: 549,
    originalPrice: 799,
    badgeKey: "badgeBestseller", // Red bestseller badge
  },
  {
    id: "dummy-book-4",
    nameKey: "book4",
    name: "पिग ब्रीडिंग मास्टरक्लास",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80",
    rating: 4.6,
    reviewCount: 112,
    price: 749,
    originalPrice: 999,
    badgeKey: "badgeFeatured", // Blue featured badge
  },
];

export const DUMMY_EQUIPMENT: HomeProduct[] = [
  comingSoonProduct("dummy-equip-1", "Essential Farm Tools Kit", PLACEHOLDER_EQUIPMENT_IMAGE),
  comingSoonProduct("dummy-equip-2", "Irrigation Equipment Set", PLACEHOLDER_EQUIPMENT_IMAGE),
  comingSoonProduct("dummy-equip-3", "Protective Gear Bundle", PLACEHOLDER_EQUIPMENT_IMAGE),
  comingSoonProduct("dummy-equip-4", "Feeding & Care Equipment", PLACEHOLDER_EQUIPMENT_IMAGE),
];

export const DUMMY_MEDICINE: HomeProduct[] = [
  comingSoonProduct("dummy-med-1", "Health Care Essentials", PLACEHOLDER_MEDICINE_IMAGE),
  comingSoonProduct("dummy-med-2", "Vaccination Kit", PLACEHOLDER_MEDICINE_IMAGE),
  comingSoonProduct("dummy-med-3", "First Aid Supplies", PLACEHOLDER_MEDICINE_IMAGE),
  comingSoonProduct("dummy-med-4", "Preventive Care Pack", PLACEHOLDER_MEDICINE_IMAGE),
];

export const DUMMY_FEED: HomeProduct[] = [
  comingSoonProduct("dummy-feed-1", "Premium Feed Mix", PLACEHOLDER_FEED_IMAGE),
  comingSoonProduct("dummy-feed-2", "Nutrition Supplement Pack", PLACEHOLDER_FEED_IMAGE),
  comingSoonProduct("dummy-feed-3", "Growth Booster Feed", PLACEHOLDER_FEED_IMAGE),
  comingSoonProduct("dummy-feed-4", "Daily Care Feed Blend", PLACEHOLDER_FEED_IMAGE),
];

export const DUMMY_VIDEOS: VideoCardData[] = [
  {
    id: "dummy-video-1",
    title: "Getting Started - Coming Soon",
    thumbnail: PLACEHOLDER_VIDEO_THUMB,
    summary: "Training videos for this farming type are being prepared.",
    category: "Getting Started",
    isPaid: false,
    comingSoon: true,
  },
  {
    id: "dummy-video-2",
    title: "Best Practices - Coming Soon",
    thumbnail: PLACEHOLDER_VIDEO_THUMB,
    summary: "Training videos for this farming type are being prepared.",
    category: "Best Practices",
    isPaid: false,
    comingSoon: true,
  },
  {
    id: "dummy-video-3",
    title: "Expert Tips - Coming Soon",
    thumbnail: PLACEHOLDER_VIDEO_THUMB,
    summary: "Training videos for this farming type are being prepared.",
    category: "Expert Tips",
    isPaid: false,
    comingSoon: true,
  },
  {
    id: "dummy-video-4",
    title: "Common Mistakes to Avoid - Coming Soon",
    thumbnail: PLACEHOLDER_VIDEO_THUMB,
    summary: "Training videos for this farming type are being prepared.",
    category: "Best Practices",
    isPaid: false,
    comingSoon: true,
  },
];

function comingSoonPost(
  id: string,
  kind: "buy" | "sell",
  title: string,
  farmingItemName: string,
): TradePost {
  return {
    id,
    userId: null,
    farmingItemId: "dummy",
    farmingItemName,
    kind,
    title,
    description: "Buy & sell listings for this farming type are coming soon.",
    quantity: "",
    unit: "",
    price: "0",
    state: "",
    district: "",
    village: "",
    contactNumber: "",
    farmerName: "AgriJivan",
    photos: [PLACEHOLDER_POST_PHOTO],
    status: "active",
    createdAt: new Date().toISOString(),
    comingSoon: true,
  };
}

export function getDummyTradePosts(farmingItemName: string): TradePost[] {
  return [
    comingSoonPost("dummy-post-buy-1", "buy", "Buyers Wanted - Coming Soon", farmingItemName),
    comingSoonPost("dummy-post-buy-2", "buy", "Bulk Purchase Requests - Coming Soon", farmingItemName),
    comingSoonPost("dummy-post-sell-1", "sell", "Produce for Sale - Coming Soon", farmingItemName),
    comingSoonPost("dummy-post-sell-2", "sell", "Stock Available - Coming Soon", farmingItemName),
  ];
}
