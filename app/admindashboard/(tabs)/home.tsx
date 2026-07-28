import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AdminHome = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem("userData");
        const token = await AsyncStorage.getItem("token");

        if (!userStr || !token) {
          router.replace("/(auth)/login");
          return;
        }

        const parsedUser = JSON.parse(userStr);

        if (parsedUser.role !== "admin") {
          router.replace("/(auth)/login");
          return;
        }

        setUser(parsedUser);
      } catch (err) {
        console.error(err);
        router.replace("/(auth)/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("userData");
    await AsyncStorage.removeItem("userType");
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#e0672c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconBadge}>
        <Ionicons name="shield-checkmark-outline" size={32} color="#2d1e3f" />
      </View>

      <Text style={styles.welcomeLabel}>Welcome back</Text>
      <Text style={styles.title}>{user?.name || "Admin"}</Text>
      <Text style={styles.subtitle}>Admin Dashboard</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AdminHome;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#f7f5f0",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#f7f5f0",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f3e8c9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  welcomeLabel: {
    fontSize: 14,
    color: "#8a7f6a",
    marginBottom: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2d1e3f",
    fontStyle: "italic",
  },

  subtitle: {
    fontSize: 13,
    color: "#a89f8c",
    marginTop: 6,
    marginBottom: 32,
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#e0672c",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 26,
    shadowColor: "#e0672c",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});