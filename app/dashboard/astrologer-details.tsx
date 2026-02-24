import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGetAstrologerById } from "../../api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://astro-backend-qdu5.onrender.com";

export default function AstrologerDetails() {
  const { astrologerId } = useLocalSearchParams();
  const router = useRouter();

  const [astro, setAstro] = useState<any>(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      const data = await apiGetAstrologerById(
        token,
        astrologerId as string
      );

      setAstro(data);
    } catch (err) {
      console.log("Failed to fetch astrologer:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchDetails();
}, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  if (!astro) {
    return (
      <View style={styles.center}>
        <Text>No details found.</Text>
      </View>
    );
  }

  const imageUrl = astro.profilePic
    ? `${BASE_URL}${astro.profilePic}`
    : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#e0c878" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Astrologer Details</Text>
        </View>

        {/* Profile Image */}
        <View style={styles.profileBox}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={60} color="#2d1e3f" />
            </View>
          )}

          <Text style={styles.name}>{astro.name}</Text>

          <Text
            style={[
              styles.status,
              astro.availability === "online"
                ? styles.online
                : styles.offline,
            ]}
          >
            {astro.availability === "online" ? "● Online" : "● Offline"}
          </Text>
        </View>

        {/* Info Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.text}>{astro.bio || "No bio available."}</Text>

          <Text style={styles.sectionTitle}>Skills</Text>
          <Text style={styles.text}>
            {Array.isArray(astro.skills)
              ? astro.skills.join(", ")
              : astro.skills}
          </Text>

          <Text style={styles.sectionTitle}>Languages</Text>
          <Text style={styles.text}>
            {Array.isArray(astro.languages)
              ? astro.languages.join(", ")
              : astro.languages}
          </Text>

          <Text style={styles.sectionTitle}>Experience</Text>
          <Text style={styles.text}>{astro.experience} years</Text>

          <Text style={styles.sectionTitle}>Price</Text>
          <Text style={styles.price}>
            ₹ {astro.pricePerMinute} / minute
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Fixed Chat Button */}
      <TouchableOpacity
        style={[
          styles.chatBtn,
          astro.availability !== "online" && styles.chatDisabled,
        ]}
        disabled={astro.availability !== "online"}
        onPress={() =>
          router.push({
            pathname: "/dashboard/chatpage",
            params: { astrologerId: astro._id },
          })
        }
      >
        <Text style={styles.chatText}>
          {astro.availability === "online"
            ? "Start Chat"
            : "Currently Offline"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#2d1e3f",
  },

  headerTitle: {
    marginLeft: 20,
    fontSize: 18,
    fontWeight: "700",
    color: "#e0c878",
  },

  profileBox: {
    alignItems: "center",
    marginTop: 20,
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#e0c878",
  },

  avatarFallback: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },

  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
    color: "#2d1e3f",
  },

  status: {
    marginTop: 6,
    fontWeight: "600",
  },

  online: {
    color: "#22c55e",
  },

  offline: {
    color: "#ef4444",
  },

  card: {
    margin: 20,
    padding: 20,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  sectionTitle: {
    fontWeight: "700",
    marginTop: 12,
    color: "#2d1e3f",
  },

  text: {
    marginTop: 4,
    color: "#4b5563",
  },

  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e0c878",
    marginTop: 4,
  },

  chatBtn: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#2d1e3f",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  chatDisabled: {
    backgroundColor: "#d1d5db",
  },

  chatText: {
    color: "#e0c878",
    fontWeight: "bold",
    fontSize: 16,
  },
});