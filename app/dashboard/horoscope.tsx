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
      const data = await apiFetchDailyHoroscope(selectedSign.toLowerCase());
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
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.headerIconBtn}>
          <Ionicons name="arrow-back" size={20} color="#2d1e3f" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Daily Horoscope</Text>

        <TouchableOpacity onPress={() => setModalVisible(true)} hitSlop={10} style={styles.headerIconBtn}>
          <Ionicons name="information-circle-outline" size={20} color="#2d1e3f" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
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
                activeOpacity={0.85}
              >
                <View style={[styles.zodiacIcon, active && styles.zodiacIconActive]}>
                  <MaterialCommunityIcons
                    name={sign.icon as any}
                    size={26}
                    color={active ? "#e0c878" : "#8a7f6a"}
                  />
                </View>
                <Text style={[styles.zodiacText, active && styles.zodiacTextActive]}>
                  {sign.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Horoscope Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <View>
              <Text style={styles.summaryTitle}>{selectedSign} Horoscope</Text>
              <Text style={styles.summaryDate}>{new Date().toDateString()}</Text>
            </View>
            <View style={styles.zodiacBadge}>
              <MaterialCommunityIcons
                name={zodiacSigns.find((s) => s.name === selectedSign)?.icon as any}
                size={26}
                color="#2d1e3f"
              />
            </View>
          </View>

          <View style={styles.divider} />

          {loading ? (
            <ActivityIndicator size="small" color="#2d1e3f" style={{ marginVertical: 12 }} />
          ) : (
            <Text style={styles.horoscopeText}>
              {horoscopeData?.description || "No horoscope available right now."}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Zodiac Date Ranges</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
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
              activeOpacity={0.85}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => router.push("/dashboard/(tabs)/chat")}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble" size={18} color="#fff" />
          <Text style={styles.bottomText}>Chat with Astrologer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2d1e3f",
    paddingTop: 50,
    padding: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerIconBtn: {
    backgroundColor: "#e0c878",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#fdf6ec",
    fontSize: 17,
    fontWeight: "700",
  },

  zodiacRow: { paddingHorizontal: 16, paddingVertical: 20 },

  zodiacItem: { alignItems: "center", marginRight: 16, width: 60 },

  zodiacIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee0bd",
  },

  zodiacIconActive: {
    backgroundColor: "#2d1e3f",
    borderColor: "#2d1e3f",
  },

  zodiacText: {
    marginTop: 6,
    fontSize: 11,
    color: "#8a7f6a",
    textAlign: "center",
  },

  zodiacTextActive: { color: "#2d1e3f", fontWeight: "700" },

  summaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eee0bd",
  },

  summaryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2d1e3f",
  },

  summaryDate: {
    fontSize: 12,
    color: "#a89f8c",
    marginTop: 2,
  },

  zodiacBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f7f5f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee0bd",
  },

  divider: {
    height: 1,
    backgroundColor: "#f2efe8",
    marginVertical: 14,
  },

  horoscopeText: {
    color: "#5c5347",
    lineHeight: 21,
    fontSize: 13.5,
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
    borderRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    color: "#2d1e3f",
  },

  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f2efe8",
  },

  dateSign: { fontWeight: "700", color: "#2d1e3f", fontSize: 13 },
  dateRange: { color: "#8a7f6a", fontSize: 12 },

  closeBtn: {
    marginTop: 16,
    backgroundColor: "#2d1e3f",
    padding: 13,
    borderRadius: 24,
    alignItems: "center",
  },

  closeText: {
    fontWeight: "700",
    color: "#e0c878",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: "#f7f5f0",
    borderTopWidth: 1,
    borderTopColor: "#eee0bd",
  },

  bottomBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0672c",
    borderRadius: 24,
    paddingVertical: 15,
    gap: 8,
  },

  bottomText: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 15,
  },
});