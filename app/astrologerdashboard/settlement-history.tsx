import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
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
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settlement History</Text>

      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.amount}>₹ {item.amount}</Text>
            <Text style={styles.date}>
              {new Date(item.paidAt).toLocaleString()}
            </Text>
            <Text style={styles.ref}>
              UPI Ref: {item.upiReference}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No settlement history</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a102b",
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a102b",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e0c878",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#2d1e3f",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4ade80",
  },
  date: {
    color: "#cccccc",
    marginTop: 5,
  },
  ref: {
    color: "#facc15",
    marginTop: 5,
  },
  empty: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 50,
  },
});