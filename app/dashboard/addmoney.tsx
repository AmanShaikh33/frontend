import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RazorpayCheckout from "react-native-razorpay";
import { apiCreateOrder, apiVerifyPayment } from "../../api/api";
import { useRouter } from "expo-router";

export default function AddMoneyScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem("userData");
        if (userStr) setUser(JSON.parse(userStr));
      } catch (err) {
        console.log("Error loading user:", err);
      }
    };
    loadUser();
  }, []);

  const handleAddMoney = async (amount: number) => {
    if (!user) {
      Alert.alert("Error", "User not loaded");
      return;
    }

    try {
      setLoading(true);

      const order = await apiCreateOrder(amount);

      const options = {
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_your_key_here",
        amount: order.amount,
        currency: "INR",
        name: "AstroTalk Wallet",
        description: "Add Wallet Balance",
        order_id: order.id,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: "#2d1e3f" },
      };

      console.log("Razorpay options:", options);

      if (!RazorpayCheckout) {
        Alert.alert("Error", "Payment gateway not available");
        return;
      }

      RazorpayCheckout.open(options)
        .then(async (data) => {
          console.log("Payment success:", data);
          
          const verifyRes = await apiVerifyPayment({
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
            userId: user._id,
            amount,
          });

          if (!verifyRes.success) {
            Alert.alert("Payment Failed", "Verification failed");
            return;
          }

          Alert.alert("Success", "Coins added successfully!");

          const updatedUser = { ...user, coins: verifyRes.coins };
          await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));

          router.replace("/dashboard/(tabs)/home");
        })
        .catch((error) => {
          console.log("Payment cancelled or failed:", error);
          if (error.code === 0) {
            Alert.alert("Payment Cancelled", "Payment was cancelled by user");
          } else {
            Alert.alert("Payment Failed", error.description || "Something went wrong");
          }
        });
    } catch (error: any) {
      console.log("Payment Error:", error);
      Alert.alert("Payment Failed", error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Money</Text>

      {[100, 200, 500, 1000].map((amount) => (
        <TouchableOpacity
          key={amount}
          onPress={() => handleAddMoney(amount)}
          style={styles.amountBtn}
          disabled={loading}
        >
          <Text style={styles.amountText}>Add ₹{amount}</Text>
        </TouchableOpacity>
      ))}

      {loading && (
        <ActivityIndicator size="large" color="#e0c878" style={{ marginTop: 20 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#2d1e3f",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#e0c878",
    marginBottom: 32,
  },

  amountBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#3c2a52",
    marginBottom: 16,
    alignItems: "center",
  },

  amountText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e0c878",
  },
});
