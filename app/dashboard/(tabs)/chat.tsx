import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AstrologerComponent from "../../../components/astrologercomponents";
import { apiGetApprovedAstrologers } from "../../../api/api";

type AstrologerType = {
  _id: string;
  name: string;
  bio?: string;
  skills: string;
  languages: string;
  experience: string;
  pricePerMinute: number;
  oldPrice?: number;
  orders?: number;
  availability: "online" | "offline" | "busy" | string;
  waitTime?: string;
  profilePic?: string;
};

const Chat = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [astrologers, setAstrologers] = useState<AstrologerType[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAstrologers = async () => {
      try {
        const data = await apiGetApprovedAstrologers();
        setAstrologers(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch astrologers");
      } finally {
        setLoading(false);
      }
    };

    fetchAstrologers();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color="#e0c878"
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      {/* Astrologers List */}
      <View style={styles.listContainer}>
        {astrologers.length === 0 ? (
          <Text style={styles.emptyText}>
            No approved astrologers available.
          </Text>
        ) : (
          astrologers.map((astro) => (
            <AstrologerComponent
              key={astro._id}
              _id={astro._id}
              name={astro.name}
              bio={astro.bio}
              skills={astro.skills}
              languages={astro.languages}
              experience={astro.experience}
              price={astro.pricePerMinute}
              oldPrice={astro.oldPrice}
              orders={astro.orders}
              status={astro.availability}
              waitTime={astro.waitTime}
              profilePic={astro.profilePic}
              onChatPress={() => router.push(`/dashboard/chatpage?astrologerId=${astro._id}`)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2d1e3f",
  },

  errorText: {
    color: "red",
    fontSize: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#2d1e3f",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#e0c878",
    marginRight: 24, // balances back arrow
  },

  listContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 24,
    color: "#777",
    fontSize: 16,
  },
});
