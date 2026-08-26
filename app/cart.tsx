import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { apiPost } from "@/lib/api-client";
import { RazorpayCheckout, type RazorpayOrder } from "@/components/checkout/razorpay-checkout";
import { OrderSuccessModal, type CompletedOrder } from "@/components/checkout/order-success-modal";
import { colors, radius, shadow } from "@/lib/theme";
import { fetchAddresses, type Address } from "@/api/addresses";

type PaymentMethod = "cod" | "razorpay";

type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
};

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { cartItems, cartLoading: loading, updateQuantity, removeItem, removeItems } = useCart();

  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);

  // Which cart items are checked for this checkout - every item defaults to
  // selected the first time it's seen, but the user's selection state for an
  // item they've already interacted with is preserved across cart updates
  // (e.g. changing a quantity shouldn't silently re-select a deselected item).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const cartItemIds = cartItems.map((i) => i.id).join(",");
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      cartItems.forEach((item) => {
        if (!seenIdsRef.current.has(item.id)) {
          next.add(item.id);
          seenIdsRef.current.add(item.id);
        }
      });
      const currentIds = new Set(cartItems.map((i) => i.id));
      Array.from(next).forEach((id) => {
        if (!currentIds.has(id)) next.delete(id);
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItemIds]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === cartItems.length ? new Set() : new Set(cartItems.map((i) => i.id)),
    );
  };

  const selectedCartItems = cartItems.filter((item) => selectedIds.has(item.id));

  // Address Selection for Checkout
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrder | null>(null);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);

  const handleUpdateQuantity = (id: string, change: number) => {
    updateQuantity(id, change);
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
  };

  const getSubtotal = () => {
    return selectedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleOpenCheckout = async () => {
    if (!user || selectedCartItems.length === 0) return;
    try {
      const userKey = user.email || user.phone || "guest";
      const fetchedAddresses = await fetchAddresses(user.id, userKey);
      setAddresses(fetchedAddresses);
      const def = fetchedAddresses.find((a) => a.isDefault);
      setSelectedAddress(def || fetchedAddresses[0] || null);
    } catch (err) {
      console.warn("Failed to load addresses:", err);
    }
    setShowAddressModal(true);
  };

  // Writes the order via the backend (which fans it out across the orders /
  // order_items / order_addresses / order_payments tables) and clears the
  // ordered items from the cart. Called once payment is settled - either
  // immediately for COD, or after Razorpay verification succeeds online.
  const finalizeOrder = async (paymentDetails?: { razorpayOrderId: string; razorpayPaymentId: string }) => {
    if (!user || !selectedAddress || selectedCartItems.length === 0) return;

    const totalAmount = getSubtotal();
    const customerName = user.user_metadata?.name || (user.email ? user.email.split("@")[0] : "Farmer");
    const paymentStatus = paymentMethod === "razorpay" ? "paid" : "pending";

    let result: { success: boolean; orderId?: string; orderNumber?: string; error?: string };
    try {
      result = await apiPost("/orders", {
        userId: user.id,
        customerName,
        customerEmail: user.email || null,
        customerPhone: selectedAddress.phone || user.phone || "",
        items: selectedCartItems.map((item) => ({
          productId: item.id,
          productName: item.title,
          productImage: item.image || null,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        subtotal: totalAmount,
        totalAmount,
        paymentMethod,
        paymentStatus,
        razorpayOrderId: paymentDetails?.razorpayOrderId || null,
        razorpayPaymentId: paymentDetails?.razorpayPaymentId || null,
        address: {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          line1: selectedAddress.village,
          village: selectedAddress.village,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pinCode,
        },
      });
    } catch (err: any) {
      console.warn("Failed to save order:", err);
      Alert.alert("Order Failed", "Couldn't place your order. Please try again.");
      return;
    }

    if (!result.success || !result.orderId) {
      console.warn("Failed to save order:", result.error);
      Alert.alert("Order Failed", result.error || "Couldn't place your order. Please try again.");
      return;
    }

    // Remove only the items that were actually ordered - anything left
    // unselected stays in the cart for next time.
    try {
      await removeItems(selectedCartItems.map((item) => item.id));
    } catch (err) {
      console.warn("Failed to clear ordered items from cart:", err);
    }

    setShowAddressModal(false);
    setCompletedOrder({
      id: result.orderNumber || result.orderId,
      itemCount: selectedCartItems.length,
      total: totalAmount,
      paymentMethod,
    });
    setShowSuccessModal(true);
  };

  const handleViewOrderDetails = () => {
    setShowSuccessModal(false);
    // Replace (not push) so the cart screen closes rather than staying in the
    // navigation stack behind the orders page.
    if (completedOrder) {
      router.replace({ pathname: "/orders", params: { openOrderId: completedOrder.id } });
    } else {
      router.replace("/orders");
    }
  };

  const handleContinueShopping = () => {
    setShowSuccessModal(false);
    router.replace("/(tabs)");
  };

  const handleConfirmCheckout = async () => {
    if (!user || selectedCartItems.length === 0 || placingOrder) return;

    if (paymentMethod === "cod") {
      setPlacingOrder(true);
      try {
        await finalizeOrder();
      } finally {
        setPlacingOrder(false);
      }
      return;
    }

    // Online payment: ask the backend to open a Razorpay order first (needs the
    // secret key, so this can only happen server-side), then hand the returned
    // order details to the Razorpay-hosted checkout WebView.
    setPlacingOrder(true);
    try {
      const result = await apiPost<{ success: boolean; orderId?: string; amount?: number; currency?: string; keyId?: string; error?: string }>(
        "/payments/create-order",
        { amount: getSubtotal(), receipt: `order_${Date.now()}` },
      );
      console.log("[checkout] create-order response:", result);
      if (!result.success || !result.orderId || !result.keyId) {
        Alert.alert("Payment", result.error || "Could not start the payment. Please try again.");
        return;
      }
      setRazorpayOrder({
        orderId: result.orderId,
        amount: result.amount!,
        currency: result.currency || "INR",
        keyId: result.keyId,
        contact: user.phone || selectedAddress?.phone,
        email: user.email || undefined,
        name: user.user_metadata?.name || selectedAddress?.name,
      });
      // Close the address modal first - two native Modals visible at once can
      // silently fail to present the second one.
      setShowAddressModal(false);
      setShowRazorpay(true);
    } catch (err: any) {
      console.log("[checkout] create-order failed:", err);
      Alert.alert("Payment", err.message || "Could not start the payment. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string, signature: string) => {
    if (!razorpayOrder) return;
    setShowRazorpay(false);
    setPlacingOrder(true);
    try {
      const result = await apiPost<{ success: boolean; error?: string }>("/payments/verify", {
        razorpay_order_id: razorpayOrder.orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });
      console.log("[checkout] verify response:", result);
      if (result.success) {
        await finalizeOrder({ razorpayOrderId: razorpayOrder.orderId, razorpayPaymentId: paymentId });
      } else {
        Alert.alert(
          "Payment",
          result.error || "Payment verification failed. If money was deducted, it will be refunded automatically.",
        );
      }
    } catch (err: any) {
      console.log("[checkout] verify failed:", err);
      Alert.alert(
        "Payment",
        err.message || "Payment verification failed. If money was deducted, it will be refunded automatically.",
      );
    } finally {
      setPlacingOrder(false);
      setRazorpayOrder(null);
    }
  };

  const handlePaymentFailed = (error: string) => {
    console.log("[checkout] payment failed:", error);
    setShowRazorpay(false);
    setRazorpayOrder(null);
    Alert.alert("Payment", error);
  };

  const handlePaymentDismiss = () => {
    setShowRazorpay(false);
    setRazorpayOrder(null);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top + 24 }]}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
            </Pressable>
            <Text style={styles.headerTitle}>Shopping Cart</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.centered}>
            <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
            <Text style={styles.messageText}>Please sign in to view your shopping cart.</Text>
            <Pressable style={styles.actionBtn} onPress={() => router.back()}>
              <Text style={styles.actionBtnText}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top + 24 }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
          </Pressable>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <View style={styles.content}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading cart items...</Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconRing}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="bag-handle-outline" size={44} color={colors.primary} />
            </View>
            <View style={[styles.emptyAccentDot, styles.emptyAccentDot1]}>
              <Ionicons name="leaf" size={12} color="#fff" />
            </View>
            <View style={[styles.emptyAccentDot, styles.emptyAccentDot2]}>
              <Ionicons name="nutrition" size={11} color="#fff" />
            </View>
          </View>

          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven&apos;t added anything yet. Explore our curated seeds,
            fertilizers, and tools to boost your farm&apos;s production!
          </Text>

          <View style={styles.emptyCategoryRow}>
            {[
              { label: "Seeds", icon: "leaf-outline" as const, section: "books" },
              { label: "Equipment", icon: "construct-outline" as const, section: "equipment" },
              { label: "Medicine", icon: "medkit-outline" as const, section: "medicine" },
              { label: "Feed", icon: "nutrition-outline" as const, section: "feed" },
            ].map((cat) => (
              <Pressable
                key={cat.section}
                style={styles.emptyCategoryChip}
                onPress={() => router.push({ pathname: "/see-all", params: { section: cat.section } })}
              >
                <View style={styles.emptyCategoryIconWrap}>
                  <Ionicons name={cat.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.emptyCategoryLabel}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Pressable style={styles.selectAllRow} onPress={toggleSelectAll}>
              <Ionicons
                name={selectedIds.size === cartItems.length ? "checkbox" : selectedIds.size === 0 ? "square-outline" : "remove-circle"}
                size={20}
                color={selectedIds.size > 0 ? colors.primary : colors.textMuted}
              />
              <Text style={styles.selectAllText}>
                {selectedIds.size === cartItems.length ? "Deselect All" : "Select All"}
              </Text>
              <Text style={styles.selectAllCount}>
                {selectedIds.size} of {cartItems.length} selected
              </Text>
            </Pressable>

            <View style={styles.productListBox}>
            {cartItems.map((item, index) => {
              const isChecked = selectedIds.has(item.id);
              return (
              <React.Fragment key={item.id}>
                {index !== 0 && <View style={styles.itemDivider} />}
                <Pressable
                  style={styles.cartCard}
                  onPress={() => setSelectedItem(item)}
                >
                <Pressable
                  style={styles.itemCheckbox}
                  hitSlop={10}
                  onPress={(e) => { e.stopPropagation?.(); toggleSelected(item.id); }}
                >
                  <Ionicons
                    name={isChecked ? "checkbox" : "square-outline"}
                    size={22}
                    color={isChecked ? colors.primary : colors.textMuted}
                  />
                </Pressable>
                {/* Product image thumbnail */}
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={{ width: 88, height: 88, borderRadius: 10, marginRight: 12 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{
                    width: 88, height: 88, borderRadius: 10, marginRight: 12,
                    backgroundColor: "#e8f5e9", alignItems: "center", justifyContent: "center",
                  }}>
                    <Ionicons name="leaf-outline" size={36} color="#2f7d32" />
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.itemPriceStrike}>
                      ₹{Math.round(item.price * item.quantity * 1.25)}
                    </Text>
                    <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 6 }}>
                    <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "700" }}>View Detail</Text>
                    <Ionicons name="chevron-down" size={12} color={colors.primary} />
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <View style={styles.quantityControl}>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={(e) => { e.stopPropagation?.(); handleUpdateQuantity(item.id, -1); }}
                    >
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </Pressable>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={(e) => { e.stopPropagation?.(); handleUpdateQuantity(item.id, 1); }}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </Pressable>
                  </View>

                  <View style={styles.actionsDivider} />

                  <Pressable style={styles.removeBtn} onPress={(e) => { e.stopPropagation?.(); handleRemoveItem(item.id); }}>
                    <Ionicons name="trash-outline" size={16} color={colors.red} />
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </Pressable>
                </View>
                </Pressable>
              </React.Fragment>
              );
            })}
            </View>

            {/* Billing breakdown summary */}
            <View style={styles.billCard}>
              <Text style={styles.billTitle}>Billing Summary</Text>

              {selectedCartItems.map((item) => (
                <View key={item.id} style={styles.billRow}>
                  <Text style={styles.billLabel} numberOfLines={1}>
                    {item.title} × {item.quantity}
                  </Text>
                  <Text style={styles.billVal}>₹{item.price * item.quantity}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Subtotal</Text>
                <Text style={styles.billVal}>₹{getSubtotal()}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>GST (18% inclusive)</Text>
                <Text style={styles.billVal}>₹{Math.round(getSubtotal() * 0.18)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Charge</Text>
                <Text style={[styles.billVal, { color: colors.primary }]}>Free</Text>
              </View>

              <View style={[styles.billRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalVal}>₹{getSubtotal()}</Text>
              </View>
            </View>

            <View style={styles.deliveryNote}>
              <Ionicons name="cube-outline" size={18} color={colors.primary} />
              <Text style={styles.deliveryNoteText}>
                Your order will be delivered within 4-5 working days.
              </Text>
            </View>
          </ScrollView>

          {/* Checkout Button */}
          <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable
              style={[styles.checkoutBtn, selectedCartItems.length === 0 && { opacity: 0.5 }]}
              disabled={selectedCartItems.length === 0}
              onPress={handleOpenCheckout}
            >
              <Text style={styles.checkoutBtnText}>
                {selectedCartItems.length === 0
                  ? "Select items to checkout"
                  : `Checkout (${selectedCartItems.length}) - ₹${getSubtotal()}`}
              </Text>
            </Pressable>
          </View>
        </>
      )}
      </View>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Address</Text>
              <Pressable onPress={() => setShowAddressModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Pressable
                style={styles.addNewAddressBtn}
                onPress={() => {
                  setShowAddressModal(false);
                  router.push("/addresses");
                }}
              >
                <Ionicons name="add-circle" size={20} color={colors.primary} />
                <Text style={styles.addNewAddressBtnText}>Add / Manage Addresses</Text>
              </Pressable>

              {addresses.length === 0 ? (
                <View style={styles.emptyAddressContainer}>
                  <Text style={styles.emptyAddressText}>
                    No saved addresses found. Please add one to continue.
                  </Text>
                </View>
              ) : (
                addresses.map((addr) => {
                  const isSelected = selectedAddress?.id === addr.id;
                  return (
                    <Pressable
                      key={addr.id}
                      style={[
                        styles.addressOption,
                        isSelected && styles.addressOptionSelected,
                      ]}
                      onPress={() => setSelectedAddress(addr)}
                    >
                      <Ionicons
                        name={isSelected ? "radio-button-on" : "radio-button-off"}
                        size={20}
                        color={isSelected ? colors.primary : colors.textMuted}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addrName}>
                          {addr.name} {addr.isDefault && <Text style={styles.defaultLabel}>(Default)</Text>}
                        </Text>
                        <Text style={styles.addrDetail}>
                          {addr.village}, {addr.city}, {addr.state} - {addr.pinCode}
                        </Text>
                        <Text style={styles.addrPhone}>Phone: {addr.phone}</Text>
                      </View>
                    </Pressable>
                  );
                })
              )}

              <Text style={styles.paymentSectionTitle}>Payment Method</Text>
              <Pressable
                style={[styles.paymentOption, paymentMethod === "cod" && styles.paymentOptionSelected]}
                onPress={() => setPaymentMethod("cod")}
              >
                <Ionicons
                  name={paymentMethod === "cod" ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={paymentMethod === "cod" ? colors.primary : colors.textMuted}
                />
                <Ionicons name="cash-outline" size={18} color={colors.textMuted} />
                <Text style={styles.paymentOptionText}>Cash on Delivery</Text>
              </Pressable>
              <Pressable
                style={[styles.paymentOption, paymentMethod === "razorpay" && styles.paymentOptionSelected]}
                onPress={() => setPaymentMethod("razorpay")}
              >
                <Ionicons
                  name={paymentMethod === "razorpay" ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={paymentMethod === "razorpay" ? colors.primary : colors.textMuted}
                />
                <Ionicons name="card-outline" size={18} color={colors.textMuted} />
                <Text style={styles.paymentOptionText}>Pay Online (Card / UPI / Netbanking)</Text>
              </Pressable>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.modalDeliveryNote}>
                Estimated delivery: 4-5 working days
              </Text>
              <Pressable
                style={[styles.confirmBtn, (!selectedAddress || placingOrder) && { opacity: 0.5 }]}
                disabled={!selectedAddress || placingOrder}
                onPress={handleConfirmCheckout}
              >
                {placingOrder ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    {paymentMethod === "cod"
                      ? "Confirm Order (Cash on Delivery)"
                      : `Pay ₹${getSubtotal()} Online`}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
        </Modal>

      {/* ─── Product Detail Bottom Sheet ─── */}
      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setSelectedItem(null)}>
          <View style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            backgroundColor: "#fff",
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: Math.max(insets.bottom + 16, 32),
          }} pointerEvents="box-none">
            {selectedItem && (
              <>
                {/* Handle bar */}
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 20 }} />

                {/* Product image */}
                <View style={{ alignItems: "center", marginBottom: 16 }}>
                  {selectedItem.image ? (
                    <Image
                      source={{ uri: selectedItem.image }}
                      style={{ width: 140, height: 140, borderRadius: 16 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{
                      width: 140, height: 140, borderRadius: 16,
                      backgroundColor: "#e8f5e9", alignItems: "center", justifyContent: "center",
                    }}>
                      <Ionicons name="leaf" size={56} color="#2f7d32" />
                    </View>
                  )}
                </View>

                {/* Title & Price */}
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 6 }}>
                  {selectedItem.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
                  <Text style={{ fontSize: 22, fontWeight: "900", color: "#2f7d32" }}>₹{selectedItem.price}</Text>
                  <Text style={{ fontSize: 14, color: "#9ca3af", textDecorationLine: "line-through" }}>₹{Math.round(selectedItem.price * 1.25)}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#16a34a" }}>20% OFF</Text>
                </View>

                {/* Quality badges */}
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                  {["✅ AgriJivan Certified", "🚚 Free Delivery", "↩️ 7 Day Return"].map((b) => (
                    <View key={b} style={{ backgroundColor: "#f0fdf4", borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: "#bbf7d0" }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#166534" }}>{b}</Text>
                    </View>
                  ))}
                </View>

                {/* Quantity controls */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151" }}>Quantity</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 0, backgroundColor: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                    <Pressable
                      style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center" }}
                      onPress={() => { handleUpdateQuantity(selectedItem.id, -1); setSelectedItem(c => c ? { ...c, quantity: Math.max(0, c.quantity - 1) } : null); }}
                    >
                      <Ionicons name="remove" size={18} color="#374151" />
                    </Pressable>
                    <Text style={{ minWidth: 32, textAlign: "center", fontWeight: "800", fontSize: 15 }}>{selectedItem.quantity}</Text>
                    <Pressable
                      style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center" }}
                      onPress={() => { handleUpdateQuantity(selectedItem.id, 1); setSelectedItem(c => c ? { ...c, quantity: c.quantity + 1 } : null); }}
                    >
                      <Ionicons name="add" size={18} color="#374151" />
                    </Pressable>
                  </View>
                </View>

                {/* Subtotal for this item */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f0fdf4", borderRadius: 12, padding: 14, marginBottom: 20 }}>
                  <Text style={{ fontWeight: "700", color: "#166534" }}>Item Total</Text>
                  <Text style={{ fontWeight: "900", fontSize: 16, color: "#166534" }}>₹{selectedItem.price * selectedItem.quantity}</Text>
                </View>

                {/* Remove from cart */}
                <Pressable
                  onPress={() => { handleRemoveItem(selectedItem.id); setSelectedItem(null); }}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderWidth: 1.5, borderColor: "#fca5a5", borderRadius: 12, backgroundColor: "#fff5f5" }}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text style={{ color: "#ef4444", fontWeight: "800", fontSize: 14 }}>Remove from Cart</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      <RazorpayCheckout
        visible={showRazorpay}
        order={razorpayOrder}
        onSuccess={handlePaymentSuccess}
        onFailed={handlePaymentFailed}
        onDismiss={handlePaymentDismiss}
      />

      <OrderSuccessModal
        visible={showSuccessModal}
        order={completedOrder}
        onViewDetails={handleViewOrderDetails}
        onContinueShopping={handleContinueShopping}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textOnDark,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    overflow: "hidden",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  selectAllCount: {
    marginLeft: "auto",
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  itemCheckbox: {
    marginRight: 10,
  },
  productListBox: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  cartCard: {
    backgroundColor: "#fff",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
    textTransform: "capitalize",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  itemPriceStrike: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    textDecorationLine: "line-through",
  },
  itemPrice: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "800",
  },
  cardActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  actionsDivider: {
    width: "100%",
    height: 1,
    backgroundColor: colors.border,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 4,
    paddingVertical: 4,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.red,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    width: 24,
    textAlign: "center",
  },
  billCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  billTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  billLabel: {
    flex: 1,
    marginRight: 8,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  billVal: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "700",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
  },
  deliveryNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f4fcf7",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
  },
  deliveryNoteText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  modalDeliveryNote: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 10,
  },
  footerContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
    ...shadow,
  },
  checkoutBtnText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "800",
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
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
    backgroundColor: "#fafdfb",
  },
  emptyIconRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(47,125,50,0.06)",
    borderWidth: 2,
    borderColor: "rgba(47,125,50,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyIconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  emptyAccentDot: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fafdfb",
  },
  emptyAccentDot1: {
    top: 4,
    right: 4,
  },
  emptyAccentDot2: {
    bottom: 10,
    left: -4,
    backgroundColor: "#f59e0b",
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#194d24",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#5c7a61",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
    marginBottom: 28,
  },
  emptyCategoryRow: {
    flexDirection: "row",
    gap: 12,
  },
  emptyCategoryChip: {
    alignItems: "center",
    gap: 6,
    width: 68,
  },
  emptyCategoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  emptyCategoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  modalScroll: {
    gap: 12,
    paddingBottom: 20,
  },
  addNewAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    gap: 8,
    marginBottom: 8,
  },
  addNewAddressBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  emptyAddressContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyAddressText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  addressOption: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addressOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#f4fcf7",
  },
  addrName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  defaultLabel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: "800",
  },
  addrDetail: {
    fontSize: 12,
    color: colors.text,
    marginTop: 2,
  },
  addrPhone: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  paymentSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    marginTop: 8,
    marginBottom: 2,
  },
  paymentOption: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#f4fcf7",
  },
  paymentOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  modalFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 10,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
    ...shadow,
  },
  confirmBtnText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
});
