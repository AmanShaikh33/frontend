import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await axios.get(
        "https://astro-backend-qdu5.onrender.com/api/chat/history",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSessions(res.data);
    } catch (error: any) {
      console.error(
        "Failed to load history:",
        error.response?.status,
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#2d1e3f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat History</Text>
        <View style={{ width: 34 }} />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.iconBadge}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#2d1e3f" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.astrologer} numberOfLines={1}>
                  {item.astrologerName || "N/A"}
                </Text>
                <Text style={styles.date}>
                  {new Date(item.startTime).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBottom}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#8a7f6a" />
                <Text style={styles.detail}>
                  {formatDuration(item.totalMinutes || 0)}
                </Text>
              </View>

              <Text style={styles.cost}>
                {item.totalCoinsDeducted || 0} coins
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="time-outline" size={40} color="#d8cdb8" />
            <Text style={styles.empty}>No chat history yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2d1e3f",
  },

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

  backBtn: {
    backgroundColor: "#e0c878",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fdf6ec",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee0bd",
    padding: 14,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#f7f5f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee0bd",
  },

  astrologer: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d1e3f",
  },

  date: {
    fontSize: 11,
    color: "#a89f8c",
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: "#f2efe8",
    marginVertical: 10,
  },

  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  detail: {
    fontSize: 12,
    color: "#8a7f6a",
  },

  cost: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e0672c",
  },

  emptyWrap: {
    alignItems: "center",
    marginTop: 80,
  },

  empty: {
    textAlign: "center",
    color: "#a89f8c",
    fontSize: 14,
    marginTop: 10,
  },
});