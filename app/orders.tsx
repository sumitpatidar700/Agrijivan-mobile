import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { apiGet } from "@/lib/api-client";
import { colors, radius, shadow } from "@/lib/theme";

type OrderItem = {
  title: string;
  price: number;
  quantity: number;
};

type OrderStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";

type Order = {
  id: string;
  orderNumber: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: "cod" | "razorpay";
  razorpayPaymentId?: string;
  deliveryAddress?: string;
};

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; stepIndex: number }> = {
  pending: { label: "Pending", color: "#e65100", bg: "#fff3e0", stepIndex: 1 },
  processing: { label: "Processing", color: "#e65100", bg: "#fff3e0", stepIndex: 1 },
  confirmed: { label: "Confirmed", color: "#1976d2", bg: "#e3f2fd", stepIndex: 2 },
  shipped: { label: "Shipped", color: "#1976d2", bg: "#e3f2fd", stepIndex: 2 },
  out_for_delivery: { label: "Out for Delivery", color: "#6a1b9a", bg: "#f3e5f5", stepIndex: 3 },
  delivered: { label: "Delivered", color: "#2e7d32", bg: "#e8f5e9", stepIndex: 3 },
  cancelled: { label: "Cancelled", color: "#c62828", bg: "#ffebee", stepIndex: 0 },
  returned: { label: "Returned", color: "#c62828", bg: "#ffebee", stepIndex: 0 },
  refunded: { label: "Refunded", color: "#616161", bg: "#f5f5f5", stepIndex: 0 },
};

const FILTERS: { value: OrderStatus | "All"; label: string }[] = [
  { value: "All", label: "All" },
  { value: "processing", label: "Pending" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function MyOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { openOrderId } = useLocalSearchParams<{ openOrderId?: string }>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [selectedDetailsOrder, setSelectedDetailsOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = (order: Order) => {
    setSelectedDetailsOrder(order);
    setShowDetailsModal(true);
  };

  // Coming from the post-checkout success screen: auto-open the order that was
  // just placed once the list has loaded.
  useEffect(() => {
    if (!openOrderId || orders.length === 0) return;
    const match = orders.find((o) => o.orderNumber === openOrderId);
    if (match) handleViewDetails(match);
  }, [openOrderId, orders]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "All">("All");

  const filteredOrders = orders.filter((order) => {
    // 1. Filter by status
    if (activeFilter !== "All" && order.status !== activeFilter) {
      return false;
    }

    // 2. Filter by search query (Date, Item name, or Order ID)
    if (searchQuery.trim() === "") {
      return true;
    }

    const query = searchQuery.toLowerCase();
    const orderIdMatches = order.orderNumber.toLowerCase().includes(query);
    const dateMatches = formatDate(order.date).toLowerCase().includes(query);
    const itemsMatch = order.items.some((item) => item.title.toLowerCase().includes(query));

    return orderIdMatches || dateMatches || itemsMatch;
  });

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiGet<any[]>(`/orders?userId=${encodeURIComponent(user.id)}`);
      const mapped: Order[] = (Array.isArray(data) ? data : []).map((ord: any) => {
        const items: OrderItem[] = Array.isArray(ord.order_items)
          ? ord.order_items.map((it: any) => ({
              title: it.product_name,
              price: Number(it.unit_price) || 0,
              quantity: it.quantity,
            }))
          : [];
        const addr = Array.isArray(ord.order_addresses) ? ord.order_addresses[0] : null;
        const deliveryAddress = addr
          ? [addr.name, addr.address_line1, addr.city, `${addr.state} - ${addr.pincode}`].filter(Boolean).join(", ")
          : ord.delivery_address
          ? [ord.delivery_name, ord.delivery_address, ord.delivery_city, `${ord.delivery_state} - ${ord.delivery_pincode}`]
              .filter(Boolean)
              .join(", ")
          : undefined;

        return {
          id: ord.id,
          orderNumber: ord.order_number || ord.id,
          date: ord.created_at || new Date().toISOString(),
          items,
          total: Number(ord.total_amount) || 0,
          status: (ord.status as OrderStatus) || "processing",
          paymentMethod: ord.payment_method === "razorpay" ? "razorpay" : "cod",
          razorpayPaymentId: ord.razorpay_payment_id || undefined,
          deliveryAddress,
        };
      });

      mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(mapped);
    } catch (err) {
      console.warn("Failed to fetch orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowTrackerModal(true);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top + 24 }]}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
            </Pressable>
            <Text style={styles.headerTitle}>My Orders</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.centered}>
            <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
            <Text style={styles.messageText}>Please sign in to view your orders.</Text>
            <Pressable style={styles.actionBtn} onPress={() => router.back()}>
              <Text style={styles.actionBtnText}>Go to Account</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top + 24 }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
          </Pressable>
          <Text style={styles.headerTitle}>My Orders</Text>
          <Pressable style={styles.refreshBtn} onPress={fetchOrders}>
            <Ionicons name="refresh" size={20} color={colors.textOnDark} />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching your orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cart-outline" size={80} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>
            Browse our catalog and order premium fertilizers, seeds, and guides!
          </Text>
          <Pressable style={styles.actionBtn} onPress={() => router.push("/products")}>
            <Text style={styles.actionBtnText}>Browse Products</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search date (e.g. Jul, 22), item or ID..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== "" && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.filterContainer}>
            {FILTERS.map((filter) => (
              <Pressable
                key={filter.value}
                style={[
                  styles.filterTab,
                  activeFilter === filter.value && styles.filterTabActive,
                ]}
                onPress={() => setActiveFilter(filter.value)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === filter.value && styles.filterTabTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {filteredOrders.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="search-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Matching Orders</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search query or status filter.
              </Text>
              <Pressable
                style={styles.actionBtn}
                onPress={() => {
                  setSearchQuery("");
                  setActiveFilter("All");
                }}
              >
                <Text style={styles.actionBtnText}>Clear Filters</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {filteredOrders.map((order) => {
                const meta = STATUS_META[order.status];
                return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderId}>{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: meta.bg },
                  ]}
                >
                  <Text style={[styles.statusText, { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Items List */}
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemBullet}>
                    <Ionicons name="ellipse" size={8} color={colors.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemQty}>
                      Qty: {item.quantity} × ₹{item.price}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>₹{item.price * item.quantity}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.footerLabel}>Total Amount</Text>
                  <Text style={styles.footerPrice}>₹{order.total}</Text>
                </View>
                <View style={styles.buttonGroup}>
                  <Pressable style={styles.detailsBtn} onPress={() => handleViewDetails(order)}>
                    <Text style={styles.detailsBtnText}>View Details</Text>
                  </Pressable>
                  <Pressable style={styles.trackBtn} onPress={() => handleTrackOrder(order)}>
                    <Text style={styles.trackBtnText}>Track Order</Text>
                  </Pressable>
                </View>
              </View>
            </View>
                );
              })}
        </ScrollView>
      )}
      </>
      )}
      </View>

      {/* Tracker Timeline Modal */}
      {selectedOrder && (() => {
        const meta = STATUS_META[selectedOrder.status];
        return (
        <Modal
          visible={showTrackerModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTrackerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order Tracker</Text>
                <Pressable onPress={() => setShowTrackerModal(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.trackerInfo}>
                <Text style={styles.trackerId}>{selectedOrder.orderNumber}</Text>
                <Text style={styles.trackerDate}>Ordered on {formatDate(selectedOrder.date)}</Text>
              </View>

              {meta.stepIndex === 0 ? (
                <View style={[styles.terminalBanner, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.terminalBannerText, { color: meta.color }]}>
                    This order was {meta.label.toLowerCase()}.
                  </Text>
                </View>
              ) : (
              <View style={styles.timelineContainer}>
                {/* Step 1 */}
                <View style={styles.timelineRow}>
                  <View style={styles.stepIndicator}>
                    <View style={[styles.stepCircle, styles.stepCircleActive]}>
                      <Ionicons name="checkmark" size={14} color={colors.surface} />
                    </View>
                    <View style={[styles.stepLine, styles.stepLineActive]} />
                  </View>
                  <View style={styles.stepDetails}>
                    <Text style={styles.stepTitle}>Order Placed</Text>
                    <Text style={styles.stepTime}>Confirmed & ready for dispatch</Text>
                  </View>
                </View>

                {/* Step 2 */}
                <View style={styles.timelineRow}>
                  <View style={styles.stepIndicator}>
                    <View
                      style={[
                        styles.stepCircle,
                        meta.stepIndex >= 2 && styles.stepCircleActive,
                      ]}
                    >
                      {meta.stepIndex >= 2 && (
                        <Ionicons name="checkmark" size={14} color={colors.surface} />
                      )}
                    </View>
                    <View
                      style={[
                        styles.stepLine,
                        meta.stepIndex >= 3 && styles.stepLineActive,
                      ]}
                    />
                  </View>
                  <View style={styles.stepDetails}>
                    <Text
                      style={[
                        styles.stepTitle,
                        meta.stepIndex >= 2 && styles.stepTitleActive,
                      ]}
                    >
                      Shipped
                    </Text>
                    <Text style={styles.stepTime}>In transit to your nearest AgriJivan Hub</Text>
                  </View>
                </View>

                {/* Step 3 */}
                <View style={styles.timelineRow}>
                  <View style={styles.stepIndicator}>
                    <View
                      style={[
                        styles.stepCircle,
                        meta.stepIndex >= 3 && styles.stepCircleActive,
                      ]}
                    >
                      {meta.stepIndex >= 3 && (
                        <Ionicons name="checkmark" size={14} color={colors.surface} />
                      )}
                    </View>
                  </View>
                  <View style={styles.stepDetails}>
                    <Text
                      style={[
                        styles.stepTitle,
                        meta.stepIndex >= 3 && styles.stepTitleActive,
                      ]}
                    >
                      Delivered
                    </Text>
                    <Text style={styles.stepTime}>Handed over to Farmer successfully</Text>
                  </View>
                </View>
              </View>
              )}

              <Pressable style={styles.doneBtn} onPress={() => setShowTrackerModal(false)}>
                <Text style={styles.doneBtnText}>Close Tracker</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        );
      })()}

      {/* Detailed Order Summary Modal */}
      {selectedDetailsOrder && (() => {
        const meta = STATUS_META[selectedDetailsOrder.status];
        return (
        <Modal
          visible={showDetailsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: "90%" }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order Details</Text>
                <Pressable onPress={() => setShowDetailsModal(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailsHeader}>
                  <View>
                    <Text style={styles.detailsOrderId}>{selectedDetailsOrder.orderNumber}</Text>
                    <Text style={styles.detailsOrderDate}>
                      Placed on: {formatDate(selectedDetailsOrder.date)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: meta.bg },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Ordered Items</Text>
                  {selectedDetailsOrder.items.map((item, idx) => (
                    <View key={idx} style={styles.detailsItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailsItemTitle}>{item.title}</Text>
                        <Text style={styles.detailsItemQty}>
                          Quantity: {item.quantity}
                        </Text>
                      </View>
                      <Text style={styles.detailsItemPrice}>
                        ₹{item.price * item.quantity}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Payment Summary</Text>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Subtotal</Text>
                    <Text style={styles.paymentVal}>₹{selectedDetailsOrder.total}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Delivery Charge</Text>
                    <Text style={[styles.paymentVal, { color: colors.primary }]}>Free</Text>
                  </View>
                  <View style={[styles.paymentRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 8 }]}>
                    <Text style={[styles.paymentLabel, { fontWeight: "800", color: colors.text }]}>Total Paid</Text>
                    <Text style={[styles.paymentVal, { fontWeight: "800", color: colors.primary, fontSize: 16 }]}>
                      ₹{selectedDetailsOrder.total}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Delivery & Payment Details</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="card-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      Payment Method: {selectedDetailsOrder.paymentMethod === "razorpay" ? "Online (Razorpay)" : "Cash on Delivery (COD)"}
                    </Text>
                  </View>
                  {selectedDetailsOrder.razorpayPaymentId && (
                    <View style={styles.metaRow}>
                      <Ionicons name="receipt-outline" size={16} color={colors.textMuted} />
                      <Text style={styles.metaText}>Payment ID: {selectedDetailsOrder.razorpayPaymentId}</Text>
                    </View>
                  )}
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      Delivery Address: {selectedDetailsOrder.deliveryAddress || "Not available"}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <Pressable style={styles.doneBtn} onPress={() => setShowDetailsModal(false)}>
                <Text style={styles.doneBtnText}>Close Details</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    ...shadow,
  },
  headerRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    padding: 4,
  },
  refreshBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    overflow: "hidden",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textOnDark,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  messageText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    fontWeight: "600",
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    ...shadow,
  },
  actionBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "800",
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  orderDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  itemBullet: {
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  itemQty: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  footerLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 2,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  trackBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  trackBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    width: "100%",
    padding: 20,
    ...shadow,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  trackerInfo: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 20,
  },
  trackerId: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  trackerDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  terminalBanner: {
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 24,
  },
  terminalBannerText: {
    fontSize: 13,
    fontWeight: "700",
  },
  timelineContainer: {
    paddingLeft: 10,
    marginBottom: 24,
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  stepIndicator: {
    alignItems: "center",
    width: 24,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepLine: {
    width: 2,
    height: 40,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  stepDetails: {
    flex: 1,
    paddingLeft: 16,
    paddingTop: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  stepTitleActive: {
    color: colors.text,
  },
  stepTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: "center",
    ...shadow,
  },
  doneBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "800",
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.background,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
    height: "100%",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  filterTabTextActive: {
    color: colors.surface,
  },
  detailsBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  detailsBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  detailsOrderId: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  detailsOrderDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  detailsSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 10,
  },
  detailsItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  detailsItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  detailsItemQty: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  detailsItemPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  paymentLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  paymentVal: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
    flex: 1,
  },
});
