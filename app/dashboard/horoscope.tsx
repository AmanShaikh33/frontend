import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiFetchDailyHoroscope } from "../../api/api";

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

const zodiacDates = [
  { sign: "Aries", range: "March 21 – April 19" },
  { sign: "Taurus", range: "April 20 – May 20" },
  { sign: "Gemini", range: "May 21 – June 20" },
  { sign: "Cancer", range: "June 21 – July 22" },
  { sign: "Leo", range: "July 23 – August 22" },
  { sign: "Virgo", range: "August 23 – September 22" },
  { sign: "Libra", range: "September 23 – October 22" },
  { sign: "Scorpio", range: "October 23 – November 21" },
  { sign: "Sagittarius", range: "November 22 – December 21" },
  { sign: "Capricorn", range: "December 22 – January 19" },
  { sign: "Aquarius", range: "January 20 – February 18" },
  { sign: "Pisces", range: "February 19 – March 20" },
];

export default function HoroscopeScreen() {
  const [selectedSign, setSelectedSign] = useState("Aries");
  const [horoscopeData, setHoroscopeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadHoroscope();
  }, [selectedSign]);

  const loadHoroscope = async () => {
    try {
      setLoading(true);
      const data = await apiFetchDailyHoroscope(
        selectedSign.toLowerCase()
      );
      setHoroscopeData(data);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load horoscope");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#e0c878" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Daily Horoscope</Text>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#e0c878"
          />
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#e0c878"
          style={{ marginTop: 20 }}
        />
      )}

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

        {/* Horoscope Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryDate}>
            {new Date().toLocaleDateString()}
          </Text>

          <Text style={styles.summaryTitle}>
            {selectedSign} Horoscope
          </Text>

          <Text style={styles.horoscopeText}>
            {horoscopeData?.description || "Loading..."}
          </Text>
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Zodiac Date Ranges</Text>

            <ScrollView>
              {zodiacDates.map((item) => (
                <View key={item.sign} style={styles.dateRow}>
                  <Text style={styles.dateSign}>{item.sign}</Text>
                  <Text style={styles.dateRange}>{item.range}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#2d1e3f",
  },
  headerTitle: {
    color: "#e0c878",
    fontSize: 18,
    fontWeight: "700",
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

  summaryCard: {
    backgroundColor: "#2d1e3f",
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 18,
    marginBottom: 100,
  },
  summaryDate: {
    textAlign: "center",
    color: "#fff",
    marginBottom: 6,
  },
  summaryTitle: {
    textAlign: "center",
    color: "#e0c878",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  horoscopeText: {
    color: "#fff",
    textAlign: "center",
    lineHeight: 22,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    color: "#2d1e3f",
  },
  dateRow: { marginBottom: 10 },
  dateSign: { fontWeight: "600", color: "#2d1e3f" },
  dateRange: { color: "#555" },

  closeBtn: {
    marginTop: 15,
    backgroundColor: "#e0c878",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: {
    fontWeight: "600",
    color: "#2d1e3f",
  },

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