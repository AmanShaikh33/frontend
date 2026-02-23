import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
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
        <ActivityIndicator size="large" color="#e0c878" />
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
      <Text style={styles.header}>Earnings History</Text>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.user}>User: {item.userName || "N/A"}</Text>
            <Text style={styles.detail}>Duration: {formatDuration(item.totalMinutes || 0)}</Text>
            <Text style={styles.earning}>Earned: {item.totalCoinsEarned || 0} coins</Text>
            <Text style={styles.date}>{new Date(item.startTime).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No earnings history</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a2e" },
  header: { fontSize: 24, fontWeight: "bold", color: "#e0c878", marginBottom: 20 },
  card: { backgroundColor: "#2d1e3f", padding: 15, borderRadius: 10, marginBottom: 10 },
  user: { fontSize: 16, fontWeight: "bold", color: "#e0c878" },
  detail: { fontSize: 14, color: "#fff", marginTop: 5 },
  earning: { fontSize: 16, color: "#27ae60", marginTop: 5, fontWeight: "bold" },
  date: { fontSize: 12, color: "#9e8b4e", marginTop: 5 },
  empty: { textAlign: "center", color: "#9e8b4e", marginTop: 50 },
});
