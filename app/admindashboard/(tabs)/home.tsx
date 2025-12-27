import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
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
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Welcome, {user?.name || "Admin"}
      </Text>

      <View style={styles.logoutBtn}>
        <Button title="Logout" onPress={handleLogout} color="#3c2a52" />
      </View>
    </View>
  );
};

export default AdminHome;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#2d1e3f",
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
    fontSize: 24,
    fontWeight: "700",
    color: "#e0c878",
    marginBottom: 20,
  },

  logoutBtn: {
    marginTop: 12,
    width: 200,
  },
});
