import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function HistoryScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      console.log("🔑 Token:", token ? "exists" : "missing");
      console.log("📡 Calling: http://10.73.18.71:5000.com/api/chat/astrologer-history");
      
      const res = await axios.get("https://astro-backend-qdu5.onrender.com/api/chat/astrologer-history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("✅ History loaded:", res.data.length, "sessions");
      setSessions(res.data);
    } catch (error) {
      console.error("❌ Failed to load history:", error.response?.status, error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e0672c" />
      </View>
    );
  }

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.header}>Earnings History</Text>
        <Text style={styles.headerSubtitle}>Your completed sessions</Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.userIconBadge}>
                <Ionicons name="person-outline" size={16} color="#2d1e3f" />
              </View>
              <Text style={styles.user}>{item.userName || "N/A"}</Text>
              <Text style={styles.earning}>+{item.totalCoinsEarned || 0} coins</Text>
            </View>

            <View style={styles.cardBottomRow}>
              <View style={styles.detailChip}>
                <Ionicons name="time-outline" size={13} color="#8a7f6a" />
                <Text style={styles.detail}>{formatDuration(item.totalMinutes || 0)}</Text>
              </View>
              <Text style={styles.date}>{new Date(item.startTime).toLocaleString()}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="wallet-outline" size={36} color="#c2b280" />
            <Text style={styles.empty}>No earnings history</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f5f0" },

  headerBar: {
    backgroundColor: "#2d1e3f",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: { fontSize: 22, fontWeight: "700", color: "#e0c878" },
  headerSubtitle: { fontSize: 12, color: "#b7a9c9", marginTop: 4 },

  listContent: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0ebe0",
    shadowColor: "#2d1e3f",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f3e8c9",
    alignItems: "center",
    justifyContent: "center",
  },
  user: { flex: 1, fontSize: 15, fontWeight: "700", color: "#2d1e3f" },
  earning: { fontSize: 14, color: "#2f9e44", fontWeight: "700" },

  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f7f5f0",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  detail: { fontSize: 12, color: "#8a7f6a" },
  date: { fontSize: 11, color: "#a89f8c" },

  emptyBox: { alignItems: "center", marginTop: 80, gap: 10 },
  empty: { textAlign: "center", color: "#a89f8c", fontSize: 14 },
});