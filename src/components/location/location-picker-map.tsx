import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/lib/theme";

export type PickedLocation = {
  latitude: number;
  longitude: number;
  village: string;
  city: string;
  state: string;
  pinCode: string;
};

type LocationPickerMapProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: PickedLocation) => void;
};

const DEFAULT_CENTER = { latitude: 22.9734, longitude: 78.6569 }; // Roughly the center of India

// Renders a Leaflet + OpenStreetMap map inside a WebView - free, no API key needed,
// same approach used for the Razorpay checkout page. Tapping/dragging the marker
// picks a point; reverse-geocoding (via OSM's free Nominatim API) runs inside the
// WebView itself and posts the resolved address fields back.
function buildMapHtml(center: { latitude: number; longitude: number }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    function report(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    try {
      var lat = ${center.latitude};
      var lng = ${center.longitude};
      var map = L.map('map').setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      var marker = L.marker([lat, lng], { draggable: true }).addTo(map);

      function notifyMoved(pos) {
        report({ status: "moved", latitude: pos.lat, longitude: pos.lng });
      }

      marker.on('dragend', function () {
        notifyMoved(marker.getLatLng());
      });
      map.on('click', function (e) {
        marker.setLatLng(e.latlng);
        notifyMoved(e.latlng);
      });

      report({ status: "ready" });
    } catch (err) {
      report({ status: "error", error: "Could not load the map: " + (err && err.message ? err.message : String(err)) });
    }

    async function confirmLocation() {
      var pos = marker.getLatLng();
      try {
        var res = await fetch(
          "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + pos.lat + "&lon=" + pos.lng,
          { headers: { "Accept-Language": "en" } }
        );
        var data = await res.json();
        var addr = data.address || {};
        report({
          status: "confirmed",
          latitude: pos.lat,
          longitude: pos.lng,
          village: addr.village || addr.suburb || addr.town || addr.hamlet || addr.road || "",
          city: addr.city || addr.town || addr.county || "",
          state: addr.state || "",
          pinCode: addr.postcode || ""
        });
      } catch (err) {
        report({
          status: "confirmed",
          latitude: pos.lat,
          longitude: pos.lng,
          village: "",
          city: "",
          state: "",
          pinCode: ""
        });
      }
    }
    window.confirmLocation = confirmLocation;

    window.recenterMap = function (lat, lng) {
      var latlng = L.latLng(lat, lng);
      map.setView(latlng, 16);
      marker.setLatLng(latlng);
      notifyMoved(latlng);
    };
  </script>
</body>
</html>`;
}

export function LocationPickerMap({ visible, onClose, onSelect }: LocationPickerMapProps) {
  const insets = useSafeAreaInsets();
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [mapReady, setMapReady] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [locating, setLocating] = useState(false);
  const webViewRef = React.useRef<WebView>(null);

  useEffect(() => {
    if (!visible) return;
    setMapReady(false);
    setConfirming(false);
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({});
          setCenter({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      } catch (err) {
        console.log("[location-picker] failed to get current location:", err);
      } finally {
        setWebViewKey((k) => k + 1);
      }
    })();
  }, [visible]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.status === "ready") {
        setMapReady(true);
      } else if (data.status === "confirmed") {
        setConfirming(false);
        onSelect({
          latitude: data.latitude,
          longitude: data.longitude,
          village: data.village,
          city: data.city,
          state: data.state,
          pinCode: data.pinCode,
        });
      } else if (data.status === "error") {
        console.log("[location-picker] error:", data.error);
      }
    } catch (err) {
      console.log("[location-picker] failed to parse message:", err);
      setConfirming(false);
    }
  };

  const handleConfirmPress = () => {
    setConfirming(true);
    webViewRef.current?.injectJavaScript("window.confirmLocation(); true;");
  };

  const handleLocateMe = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("[location-picker] location permission denied");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      webViewRef.current?.injectJavaScript(
        `window.recenterMap(${pos.coords.latitude}, ${pos.coords.longitude}); true;`,
      );
    } catch (err) {
      console.log("[location-picker] failed to locate:", err);
    } finally {
      setLocating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.topBarTitle}>Select Location</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={{ flex: 1 }}>
          <WebView
            key={webViewKey}
            ref={webViewRef}
            source={{ html: buildMapHtml(center) }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          />

          <Pressable
            style={[styles.locateBtn, locating && { opacity: 0.6 }]}
            onPress={handleLocateMe}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="locate" size={22} color={colors.primary} />
            )}
          </Pressable>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.footerHint}>Tap or drag the pin to choose the exact spot</Text>
          <Pressable
            style={[styles.confirmBtn, !mapReady && { opacity: 0.5 }]}
            disabled={!mapReady || confirming}
            onPress={handleConfirmPress}
          >
            {confirming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>Use This Location</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  locateBtn: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  footerHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
