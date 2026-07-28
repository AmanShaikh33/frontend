import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function SettlementHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await axios.get(
        "https://astro-backend-qdu5.onrender.com/api/astrologers/settlement-history",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setHistory(res.data);
    } catch (err) {
      console.error(err);
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

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.header}>Settlement History</Text>
        <Text style={styles.headerSubtitle}>Your payout records</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#2f9e44" />
              </View>
              <Text style={styles.amount}>₹ {item.amount}</Text>
            </View>

            <View style={styles.cardDetailRow}>
              <Ionicons name="calendar-outline" size={13} color="#a89f8c" />
              <Text style={styles.date}>
                {new Date(item.paidAt).toLocaleString()}
              </Text>
            </View>

            <View style={styles.cardDetailRow}>
              <Ionicons name="receipt-outline" size={13} color="#e0a800" />
              <Text style={styles.ref}>UPI Ref: {item.upiReference}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={36} color="#c2b280" />
            <Text style={styles.empty}>No settlement history</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f5f0",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f5f0",
  },
  headerBar: {
    backgroundColor: "#2d1e3f",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e0c878",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#b7a9c9",
    marginTop: 4,
  },
  listContent: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
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
    marginBottom: 10,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eafbea",
    alignItems: "center",
    justifyContent: "center",
  },
  amount: {
    fontSize: 19,
    fontWeight: "800",
    color: "#2d1e3f",
  },
  cardDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  date: {
    color: "#8a7f6a",
    fontSize: 12,
  },
  ref: {
    color: "#8a6d1f",
    fontSize: 12,
  },
  emptyBox: { alignItems: "center", marginTop: 80, gap: 10 },
  empty: {
    color: "#a89f8c",
    textAlign: "center",
    fontSize: 14,
  },
});