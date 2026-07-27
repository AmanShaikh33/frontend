import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RazorpayCheckout from "react-native-razorpay";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiCreateOrder, apiVerifyPayment } from "../../api/api";

const AMOUNT_OPTIONS = [100, 200, 500, 1000, 2000, 5000];

export default function AddMoneyScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

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

      if (!RazorpayCheckout) {
        Alert.alert("Error", "Payment gateway not available");
        return;
      }

      RazorpayCheckout.open(options)
        .then(async (data) => {
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
          if (error.code === 0) {
            Alert.alert("Payment Cancelled", "Payment was cancelled by user");
          } else {
            Alert.alert("Payment Failed", error.description || "Something went wrong");
          }
        });
    } catch (error: any) {
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#2d1e3f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Money</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceIconBadge}>
            <Ionicons name="wallet-outline" size={22} color="#2d1e3f" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>₹ {user.coins ?? 0}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Amount</Text>

        <View style={styles.grid}>
          {AMOUNT_OPTIONS.map((amount) => {
            const isSelected = selectedAmount === amount;
            return (
              <TouchableOpacity
                key={amount}
                style={[styles.amountCard, isSelected && styles.amountCardSelected]}
                onPress={() => setSelectedAmount(amount)}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={[styles.amountText, isSelected && styles.amountTextSelected]}>
                  ₹{amount}
                </Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.secureRow}>
          <Ionicons name="lock-closed-outline" size={14} color="#8a7f6a" />
          <Text style={styles.secureText}>Payments secured by Razorpay</Text>
        </View>
      </ScrollView>

      {/* Bottom fixed CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payBtn,
            (!selectedAmount || loading) && styles.payBtnDisabled,
          ]}
          disabled={!selectedAmount || loading}
          activeOpacity={0.85}
          onPress={() => selectedAmount && handleAddMoney(selectedAmount)}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.payBtnText}>
              {selectedAmount ? `Add ₹${selectedAmount}` : "Select an amount"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2d1e3f",
  },

  container: {
    flex: 1,
    backgroundColor: "#f7f5f0",
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

  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eee0bd",
  },

  balanceIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f7f5f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee0bd",
  },

  balanceLabel: {
    fontSize: 12,
    color: "#8a7f6a",
  },

  balanceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d1e3f",
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d1e3f",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },

  amountCard: {
    width: "31%",
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#eee0bd",
    alignItems: "center",
    justifyContent: "center",
  },

  amountCardSelected: {
    backgroundColor: "#2d1e3f",
    borderColor: "#2d1e3f",
  },

  amountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d1e3f",
  },

  amountTextSelected: {
    color: "#e0c878",
  },

  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },

  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
  },

  secureText: {
    fontSize: 12,
    color: "#8a7f6a",
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

  payBtn: {
    backgroundColor: "#e0672c",
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
  },

  payBtnDisabled: {
    backgroundColor: "#d8cdb8",
  },

  payBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});