import React, { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUpdateAvailability } from "../../../api/api";

const UserHome = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<"online" | "offline">("offline");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem("userData");
        const token = await AsyncStorage.getItem("token");

        if (!userStr || !token) {
          router.replace("/login");
          return;
        }

        const parsedUser = JSON.parse(userStr);

        if (parsedUser.role !== "astrologer") {
          router.replace("/login"); 
          return;
        }

        setUser(parsedUser);
       
        if (parsedUser.availability) setAvailability(parsedUser.availability);
      } catch (err) {
        console.error(err);
        router.replace("/login");
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
    router.replace("/login");
  };

  const toggleAvailability = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const newStatus = availability === "online" ? "offline" : "online";
      await apiUpdateAvailability(token, newStatus);
      setAvailability(newStatus);

      // Optionally update AsyncStorage userData
      const updatedUser = { ...user, availability: newStatus };
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#2d1e3f]">
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-[#2d1e3f]">
      <Text className="text-2xl font-bold text-[#e0c878] mb-6">
        Welcome, {user?.name || "User"}
      </Text>

      <TouchableOpacity
        onPress={toggleAvailability}
        className={`py-3 px-6 rounded-lg mb-6 ${
          availability === "online" ? "bg-green-500" : "bg-red-500"
        }`}
        disabled={updating}
      >
        <Text className="text-white font-bold text-lg">
          {updating ? "Updating..." : availability === "online" ? "Go Offline" : "Go Online"}
        </Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <Button title="Logout" onPress={handleLogout} color="#3c2a52" />
    </View>
  );
};

export default UserHome;
