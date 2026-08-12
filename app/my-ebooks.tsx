import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useProductsQuery } from "@/api";
import { colors, radius, shadow } from "@/lib/theme";
import type { Product } from "@/lib/agri-data";

type OrderedItem = {
  id: string;
  title: string;
  image?: string;
  quantity: number;
};

type OrderRow = {
  id: string;
  date: string;
  status: "Processing" | "Shipped" | "Delivered";
  items: OrderedItem[];
};

type OrderedBook = {
  key: string;
  productId: string;
  title: string;
  image?: string;
  quantity: number;
  orderId: string;
  orderDate: string;
  orderStatus: OrderRow["status"];
  ebookPdfUrl: string | null;
};

const FALLBACK_COVER = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80";

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function MyEbooksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { locale } = useLanguage();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const { data: products, isLoading: productsLoading } = useProductsQuery(locale || "en");

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchOrders = async () => {
    if (!user) {
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    let allOrders: OrderRow[] = [];
    const supabase = getSupabaseClient();
    const userKey = user.email || user.phone || "guest";

    if (supabase && user.email) {
      try {
        const { data, error } = await (supabase.from("orders") as any)
          .select("*")
          .eq("customer_email", user.email);

        if (!error && data) {
          allOrders = data.map((ord: any) => ({
            id: ord.id,
            date: ord.created_at || ord.date || new Date().toISOString(),
            status: ord.status || "Processing",
            items: typeof ord.items === "string" ? JSON.parse(ord.items) : ord.items || [],
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch Supabase orders:", err);
      }
    }

    try {
      const localOrdersStr = await AsyncStorage.getItem(`agrijivan-orders-${userKey}`);
      if (localOrdersStr) {
        const localOrders = JSON.parse(localOrdersStr);
        localOrders.forEach((localOrd: OrderRow) => {
          if (!allOrders.some((o) => o.id === localOrd.id)) {
            allOrders.push(localOrd);
          }
        });
      }
    } catch (err) {
      console.warn("Failed to fetch local orders:", err);
    }

    allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setOrders(allOrders);
    setOrdersLoading(false);
  };

  const bookProductsById = useMemo(() => {
    const map = new Map<string, Product>();
    (products ?? []).filter((p) => p.section === "books").forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const orderedBooks: OrderedBook[] = useMemo(() => {
    const results: OrderedBook[] = [];
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const product = bookProductsById.get(item.id);
        if (product) {
          results.push({
            key: `${order.id}-${item.id}`,
            productId: item.id,
            title: item.title,
            image: item.image,
            quantity: item.quantity,
            orderId: order.id,
            orderDate: order.date,
            orderStatus: order.status,
            ebookPdfUrl: product.ebook_pdf_url || null,
          });
        }
      });
    });
    return results;
  }, [orders, bookProductsById]);

  const isLoading = ordersLoading || productsLoading;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>My eBooks</Text>
        <View style={styles.headerIconBtn} />
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : orderedBooks.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="book-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No books ordered yet</Text>
            <Text style={styles.emptyDesc}>
              Books you order will show up here, along with their eBook access.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {orderedBooks.map((book) => (
              <View key={book.key} style={styles.card}>
                <View style={styles.cardTop}>
                  <Image source={{ uri: book.image || FALLBACK_COVER }} style={styles.cover} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.title} numberOfLines={2}>
                      {book.title}
                    </Text>
                    {book.quantity > 1 && <Text style={styles.qty}>Qty: {book.quantity}</Text>}
                    <View style={styles.metaRow}>
                      <Ionicons name="receipt-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {book.orderId} · {formatDate(book.orderDate)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        book.orderStatus === "Delivered" && styles.statusDelivered,
                        book.orderStatus === "Shipped" && styles.statusShipped,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          book.orderStatus === "Delivered" && styles.statusTextDelivered,
                          book.orderStatus === "Shipped" && styles.statusTextShipped,
                        ]}
                      >
                        {book.orderStatus}
                      </Text>
                    </View>
                  </View>
                </View>

                {book.ebookPdfUrl ? (
                  <Pressable
                    style={styles.ebookBtn}
                    onPress={() => Linking.openURL(book.ebookPdfUrl!).catch(() => {})}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#fff" />
                    <Text style={styles.ebookBtnText}>Read eBook</Text>
                  </Pressable>
                ) : (
                  <View style={styles.noEbookRow}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.noEbookText}>No ebook found for this book</Text>
                  </View>
                )}
              </View>
            ))}
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
  },
  ebookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginTop: 12,
  },
  ebookBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  noEbookRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noEbookText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  cover: {
    width: 56,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: "#eee",
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 19,
  },
  qty: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    flexShrink: 1,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(217,119,6,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#d97706",
  },
  statusShipped: {
    backgroundColor: "rgba(37,99,235,0.1)",
  },
  statusTextShipped: {
    color: "#2563eb",
  },
  statusDelivered: {
    backgroundColor: "rgba(22,163,74,0.1)",
  },
  statusTextDelivered: {
    color: "#16a34a",
  },
});
