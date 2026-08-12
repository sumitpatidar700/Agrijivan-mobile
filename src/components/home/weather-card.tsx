import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";

import { Card } from "@/components/ui/card";
import { colors, radius } from "@/lib/theme";

// Helper to map Open-Meteo weather codes
function getWeatherDetails(code: number) {
  switch (code) {
    case 0:
      return { label: "Clear Sky", icon: "sunny" as const, color: colors.warning };
    case 1:
    case 2:
    case 3:
      return { label: "Partly Cloudy", icon: "partly-sunny" as const, color: colors.warning };
    case 45:
    case 48:
      return { label: "Foggy", icon: "cloud-outline" as const, color: colors.tabInactive };
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return { label: "Rainy", icon: "rainy" as const, color: colors.blue };
    case 95:
    case 96:
    case 99:
      return { label: "Thunderstorm", icon: "thunderstorm" as const, color: colors.primary };
    default:
      return { label: "Clear Sky", icon: "sunny" as const, color: colors.warning };
  }
}

let cachedWeather: any = null;

export function clearWeatherCache() {
  cachedWeather = null;
}

export function WeatherCard() {
  const [loading, setLoading] = useState(!cachedWeather);
  const [weather, setWeather] = useState<any>(cachedWeather);

  useEffect(() => {
    if (cachedWeather) return;

    // Lat & Long for Indore, MP
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=22.7196&longitude=75.8577&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,surface_pressure,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto"
    )
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        throw new Error("Received non-JSON response from API");
      })
      .then((data) => {
        cachedWeather = data;
        setWeather(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Weather fetch failed, using offline fallback:", err.message);
        setLoading(false); // set to false to render fallback Indore weather metrics
      });
  }, []);

  if (loading) {
    return (
      <Card style={[styles.card, styles.center]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching live weather...</Text>
      </Card>
    );
  }

  // Fallback to defaults if fetch fails
  const currentTemp = weather?.current?.temperature_2m ?? 32;
  const humidity = weather?.current?.relative_humidity_2m ?? 24;
  const rain = weather?.current?.rain ?? 0;
  const pressure = weather?.current?.surface_pressure ?? 1012;
  const wind = weather?.current?.wind_speed_10m ?? 8;
  const code = weather?.current?.weather_code ?? 2;
  
  const tempMax = weather?.daily?.temperature_2m_max?.[0] ?? 36;
  const tempMin = weather?.daily?.temperature_2m_min?.[0] ?? 24;
  
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const sunrise = formatTime(weather?.daily?.sunrise?.[0]) || "6:12 am";
  const sunset = formatTime(weather?.daily?.sunset?.[0]) || "6:48 pm";

  const details = getWeatherDetails(code);

  const stats = [
    { label: "Humidity", value: `${humidity}%`, icon: "water-outline" as const },
    { label: "Rain", value: `${rain} mm`, icon: "rainy-outline" as const },
    { label: "Pressure", value: `${Math.round(pressure)} hPa`, icon: "speedometer-outline" as const },
    { label: "Wind", value: `${wind} km/h`, icon: "flag-outline" as const },
  ];

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={14} color={colors.primary} />
          <Text style={styles.location}>Indore, Madhya Pradesh</Text>
        </View>
        <Ionicons name={details.icon} size={36} color={details.color} />
      </View>

      <View style={styles.tempRow}>
        <Text style={styles.temp}>+{Math.round(currentTemp)}°C</Text>
        <View>
          <Text style={styles.highLow}>H: {Math.round(tempMax)}°  L: {Math.round(tempMin)}°</Text>
          <Text style={styles.condition}>{details.label}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Ionicons name={stat.icon} size={16} color={colors.primaryLight} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sunRow}>
        <Text style={styles.sunLabel}>Sunrise  {sunrise}</Text>
        <View style={styles.sunArc}>
          <View style={styles.sunDot} />
        </View>
        <Text style={styles.sunLabel}>Sunset  {sunset}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: -40,
    marginHorizontal: 20,
    minHeight: 230,
  },
  center: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
  tempRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
  },
  temp: {
    fontSize: 40,
    fontWeight: "700",
    color: colors.text,
  },
  highLow: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },
  condition: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statItem: {
    width: "47%",
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: 12,
    gap: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  sunRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sunLabel: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
    textAlign: "center",
  },
  sunArc: {
    flex: 2,
    height: 28,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  sunDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.warning,
    marginTop: -8,
  },
});
