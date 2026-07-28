import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRoute } from "@react-navigation/native";

export default function AdminSettlementScreen() {
  const route = useRoute<any>();
  const { astrologerId } = route.params;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [upiReference, setUpiReference] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await axios.get(
        `https://astro-backend-qdu5.onrender.com/api/admin/settlement-summary/${astrologerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSummary(res.data);
    } catch (err: any) {
      Alert.alert("Error", "Failed to load settlement summary");
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async () => {
    if (!upiReference.trim()) {
      Alert.alert("Error", "Enter UPI Reference");
      return;
    }

    try {
      setPaying(true);
      const token = await AsyncStorage.getItem("token");

      const res = await axios.post(
        `https://astro-backend-qdu5.onrender.com/api/admin/settle/${astrologerId}`,
        { upiReference },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert("Success", `Paid ₹${res.data.paidAmount}`);
      setUpiReference("");
      fetchSummary();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Settlement failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e0672c" />
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.noDataText}>No data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.header}>Settlement Summary</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="trending-up-outline" size={16} color="#8a7f6a" />
            <Text style={styles.rowLabel}>Total Earnings</Text>
            <Text style={styles.rowValue}>₹{summary.totalEarnings}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="checkmark-done-outline" size={16} color="#8a7f6a" />
            <Text style={styles.rowLabel}>Total Paid</Text>
            <Text style={styles.rowValue}>₹{summary.totalPaid}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons name="wallet-outline" size={18} color="#e0a800" />
            <Text style={styles.unpaidLabel}>Unpaid Amount</Text>
            <Text style={styles.unpaid}>₹{summary.unpaidAmount}</Text>
          </View>
        </View>

        {summary.unpaidAmount > 0 && (
          <>
            <Text style={styles.label}>UPI Reference</Text>
            <View style={styles.inputRow}>
              <Ionicons name="receipt-outline" size={18} color="#a3915a" />
              <TextInput
                style={styles.input}
                placeholder="Enter UPI Reference"
                placeholderTextColor="#c2b280"
                value={upiReference}
                onChangeText={setUpiReference}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, paying && { opacity: 0.7 }]}
              onPress={handleSettle}
              disabled={paying}
              activeOpacity={0.85}
            >
              {paying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Settle Full Amount</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
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
  noDataText: { color: "#8a7f6a" },
  headerBar: {
    backgroundColor: "#2d1e3f",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e0c878",
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f0ebe0",
    shadowColor: "#2d1e3f",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  rowLabel: { flex: 1, color: "#8a7f6a", fontSize: 14 },
  rowValue: { color: "#2d1e3f", fontSize: 15, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#f2efe8", marginVertical: 6 },
  unpaidLabel: { flex: 1, color: "#8a6d1f", fontSize: 14, fontWeight: "600" },
  unpaid: {
    color: "#e0a800",
    fontSize: 19,
    fontWeight: "800",
  },
  label: { color: "#8a7f6a", marginBottom: 6, fontSize: 12, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.2,
    borderColor: "#eee0bd",
    backgroundColor: "#fffdf7",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: "#2d1e3f",
    paddingVertical: 12,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e0672c",
    paddingVertical: 15,
    borderRadius: 24,
    shadowColor: "#e0672c",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buttonText: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 15,
  },
});