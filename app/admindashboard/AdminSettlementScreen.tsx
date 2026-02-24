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
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>No data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settlement Summary</Text>

      <View style={styles.card}>
        <Text style={styles.text}>Total Earnings: ₹{summary.totalEarnings}</Text>
        <Text style={styles.text}>Total Paid: ₹{summary.totalPaid}</Text>
        <Text style={styles.unpaid}>
          Unpaid Amount: ₹{summary.unpaidAmount}
        </Text>
      </View>

      {summary.unpaidAmount > 0 && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter UPI Reference"
            placeholderTextColor="#aaa"
            value={upiReference}
            onChangeText={setUpiReference}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSettle}
            disabled={paying}
          >
            <Text style={styles.buttonText}>
              {paying ? "Processing..." : "Settle Full Amount"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
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
    borderRadius: 10,
    marginBottom: 20,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  unpaid: {
    color: "#27ae60",
    fontSize: 18,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#2d1e3f",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#e0c878",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "bold",
    color: "#1a1a2e",
  },
});