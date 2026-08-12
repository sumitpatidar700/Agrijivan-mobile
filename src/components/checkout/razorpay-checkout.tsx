import React from "react";
import { ActivityIndicator, Modal, StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import type { WebViewErrorEvent, WebViewHttpErrorEvent } from "react-native-webview/lib/WebViewTypes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

export type RazorpayOrder = {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  contact?: string;
  email?: string;
  name?: string;
};

type RazorpayCheckoutProps = {
  visible: boolean;
  order: RazorpayOrder | null;
  onSuccess: (paymentId: string, signature: string) => void;
  onFailed: (error: string) => void;
  onDismiss: () => void;
};

// Loads Razorpay's own hosted checkout.js inside a WebView and opens the payment
// sheet immediately - card/UPI/netbanking/wallet forms are all handled by Razorpay
// itself, so no card data ever passes through this app.
//
// Every failure mode (script blocked, SDK throws, nothing opens in time) posts a
// "failed" message back instead of leaving a silent blank screen, since a WebView
// script error is otherwise invisible from the RN side.
function buildCheckoutHtml(order: RazorpayOrder) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>html,body{margin:0;padding:0;background:#fff;height:100%;}</style>
</head>
<body>
  <script>
    function report(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }
    window.onerror = function (message) {
      report({ status: "failed", error: "Payment page error: " + message });
    };
    // If Razorpay's checkout.js never finishes loading/opening within 12s
    // (blocked network, slow connection, etc.), fail loudly instead of
    // leaving a blank screen forever.
    var openedInTime = false;
    setTimeout(function () {
      if (!openedInTime) {
        report({ status: "failed", error: "Payment page took too long to load. Check your internet connection and try again." });
      }
    }, 12000);
  </script>
  <script
    src="https://checkout.razorpay.com/v1/checkout.js"
    onerror="report({ status: 'failed', error: 'Could not load the Razorpay payment page. Check your internet connection.' })"
  ></script>
  <script>
    try {
      var options = {
        key: ${JSON.stringify(order.keyId)},
        amount: ${JSON.stringify(String(order.amount))},
        currency: ${JSON.stringify(order.currency)},
        order_id: ${JSON.stringify(order.orderId)},
        name: "AgriJivan",
        description: "Order Payment",
        theme: { color: "#0A2E19" },
        prefill: {
          contact: ${JSON.stringify(order.contact || "")},
          email: ${JSON.stringify(order.email || "")},
          name: ${JSON.stringify(order.name || "")}
        },
        handler: function (response) {
          report({
            status: "success",
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
        },
        modal: {
          ondismiss: function () {
            report({ status: "dismissed" });
          }
        }
      };
      var rzp = new Razorpay(options);
      rzp.on("payment.failed", function (response) {
        report({
          status: "failed",
          error: (response && response.error && response.error.description) || "Payment failed"
        });
      });
      rzp.open();
      openedInTime = true;
    } catch (err) {
      report({ status: "failed", error: "Could not start the payment page: " + (err && err.message ? err.message : String(err)) });
    }
  </script>
</body>
</html>`;
}

export function RazorpayCheckout({ visible, order, onSuccess, onFailed, onDismiss }: RazorpayCheckoutProps) {
  const insets = useSafeAreaInsets();

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("[razorpay-checkout] message:", data);
      if (data.status === "success") {
        onSuccess(data.razorpay_payment_id, data.razorpay_signature);
      } else if (data.status === "failed") {
        onFailed(data.error || "Payment failed. Please try again.");
      } else if (data.status === "dismissed") {
        onDismiss();
      }
    } catch (err) {
      console.log("[razorpay-checkout] failed to parse message:", err);
      onFailed("Something went wrong while processing the payment.");
    }
  };

  const handleWebViewError = (event: WebViewErrorEvent) => {
    console.log("[razorpay-checkout] WebView error:", event.nativeEvent);
    onFailed("Could not open the payment page. Check your internet connection and try again.");
  };

  const handleHttpError = (event: WebViewHttpErrorEvent) => {
    console.log("[razorpay-checkout] WebView HTTP error:", event.nativeEvent);
    onFailed("Could not open the payment page. Check your internet connection and try again.");
  };

  if (!order) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <WebView
          source={{ html: buildCheckoutHtml(order) }}
          onMessage={handleMessage}
          onError={handleWebViewError}
          onHttpError={handleHttpError}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          mixedContentMode="always"
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.header },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
