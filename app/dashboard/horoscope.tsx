import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const zodiacSigns = [
  { name: "Aries", icon: "zodiac-aries" },
  { name: "Taurus", icon: "zodiac-taurus" },
  { name: "Gemini", icon: "zodiac-gemini" },
  { name: "Cancer", icon: "zodiac-cancer" },
  { name: "Leo", icon: "zodiac-leo" },
  { name: "Virgo", icon: "zodiac-virgo" },
  { name: "Libra", icon: "zodiac-libra" },
  { name: "Scorpio", icon: "zodiac-scorpio" },
  { name: "Sagittarius", icon: "zodiac-sagittarius" },
  { name: "Capricorn", icon: "zodiac-capricorn" },
  { name: "Aquarius", icon: "zodiac-aquarius" },
  { name: "Pisces", icon: "zodiac-pisces" },
];

export default function HoroscopeScreen() {
  const [selectedSign, setSelectedSign] = useState("Aries");
  const [selectedDay, setSelectedDay] = useState("Today");
  const router = useRouter();

  const horoscopeData = {
    luckyColours: ["#ff0000", "#0066ff"],
    mood: "😍",
    luckyNumber: 7,
    luckyTime: "04:26 PM",
    love: {
      percentage: 40,
      text:
        "Romance ignites with fiery passion today. Single Aries may encounter someone who matches their dynamic energy.",
    },
    career: {
      percentage: 60,
      text:
        "Professional breakthroughs await as your pioneering spirit shines in the workplace.",
    },
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#e0c878" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Horoscope</Text>
      </View>

      <ScrollView>
        {/* Zodiac Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.zodiacRow}
        >
          {zodiacSigns.map((sign) => {
            const active = selectedSign === sign.name;
            return (
              <TouchableOpacity
                key={sign.name}
                onPress={() => setSelectedSign(sign.name)}
                style={styles.zodiacItem}
              >
                <View
                  style={[
                    styles.zodiacIcon,
                    active && styles.zodiacIconActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={sign.icon as any}
                    size={28}
                    color={active ? "#2d1e3f" : "#444"}
                  />
                </View>
                <Text
                  style={[
                    styles.zodiacText,
                    active && styles.zodiacTextActive,
                  ]}
                >
                  {sign.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Day Selector */}
        <View style={styles.dayRow}>
          {["Yesterday", "Today", "Tomorrow"].map((day) => {
            const active = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayBtn,
                  active && styles.dayBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    active && styles.dayTextActive,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryDate}>11-08-2025</Text>
          <Text style={styles.summaryTitle}>
            Your Daily Horoscope is Ready!
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.center}>
              <Text style={styles.summaryLabel}>Lucky Colours</Text>
              <View style={styles.colorRow}>
                {horoscopeData.luckyColours.map((c, i) => (
                  <View
                    key={i}
                    style={[styles.colorDot, { backgroundColor: c }]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.center}>
              <Text style={styles.summaryLabel}>Mood</Text>
              <Text style={styles.mood}>{horoscopeData.mood}</Text>
            </View>

            <View style={styles.center}>
              <Text style={styles.summaryLabel}>Lucky Number</Text>
              <Text style={styles.gold}>{horoscopeData.luckyNumber}</Text>
            </View>

            <View style={styles.center}>
              <Text style={styles.summaryLabel}>Lucky Time</Text>
              <Text style={styles.gold}>{horoscopeData.luckyTime}</Text>
            </View>
          </View>
        </View>

        {/* Love */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart" size={20} color="#2d1e3f" />
            <Text style={styles.sectionTitle}>Love</Text>
            <Text style={styles.sectionPercent}>
              {horoscopeData.love.percentage}%
            </Text>
          </View>
          <Text style={styles.sectionText}>
            {horoscopeData.love.text}
          </Text>
        </View>

        {/* Career */}
        <View style={[styles.sectionCard, { marginBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase" size={20} color="#2d1e3f" />
            <Text style={styles.sectionTitle}>Career</Text>
            <Text style={styles.sectionPercent}>
              {horoscopeData.career.percentage}%
            </Text>
          </View>
          <Text style={styles.sectionText}>
            {horoscopeData.career.text}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <TouchableOpacity
        style={styles.bottomBtn}
        onPress={() => router.push("/dashboard/(tabs)/chat")}
      >
        <Ionicons name="chatbubble" size={20} color="#2d1e3f" />
        <Text style={styles.bottomText}>Chat with Astrologer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#2d1e3f",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#e0c878",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 24,
  },

  zodiacRow: { paddingHorizontal: 16, paddingVertical: 12 },
  zodiacItem: { alignItems: "center", marginRight: 16 },
  zodiacIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  zodiacIconActive: { backgroundColor: "#e0c878" },
  zodiacText: { marginTop: 4, fontSize: 12, color: "#666" },
  zodiacTextActive: { color: "#2d1e3f", fontWeight: "600" },

  dayRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  dayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal: 6,
  },
  dayBtnActive: {
    backgroundColor: "#e0c878",
    borderColor: "#e0c878",
  },
  dayText: { color: "#555" },
  dayTextActive: { color: "#2d1e3f", fontWeight: "600" },

  summaryCard: {
    backgroundColor: "#2d1e3f",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  summaryDate: { textAlign: "center", color: "#fff" },
  summaryTitle: {
    textAlign: "center",
    color: "#e0c878",
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  summaryLabel: { color: "#fff", fontSize: 12 },
  colorRow: { flexDirection: "row", marginTop: 4 },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginHorizontal: 2 },
  mood: { fontSize: 18 },
  gold: { color: "#e0c878" },
  center: { alignItems: "center" },

  sectionCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e0c878",
    backgroundColor: "#fdf8f0",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitle: {
    marginLeft: 6,
    fontWeight: "600",
    color: "#2d1e3f",
  },
  sectionPercent: {
    marginLeft: "auto",
    color: "#2d1e3f",
    fontWeight: "600",
  },
  sectionText: { color: "#555" },

  bottomBtn: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0c878",
    padding: 16,
    paddingBottom: 32,
  },
  bottomText: {
    marginLeft: 8,
    fontWeight: "600",
    color: "#2d1e3f",
  },
});
