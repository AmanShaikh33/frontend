import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  apiGetAstrologersWithFilter,
  apiApproveAstrologer,
  apiRejectAstrologer,
  apiAdminDeleteAstrologer,
} from "../../../api/api";
import { useRouter } from "expo-router";

interface Astrologer {
  _id: string;
  name: string;
  bio: string;
  skills: string[];
  languages: string[];
  pricePerMinute: number;
  experience: number;
  profilePic?: string;
  isApproved: "pending" | "approved";
}

export default function AdminAstrologers() {
  const router = useRouter();

  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAstrologers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Admin token not found. Please login again.");
        return;
      }

      const data = await apiGetAstrologersWithFilter(token);
      setAstrologers(data.astrologers || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch astrologers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAstrologers();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      await apiApproveAstrologer(token, id);
      Alert.alert("Success", "Astrologer approved!");
      fetchAstrologers();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to approve astrologer");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      await apiRejectAstrologer(token, id);
      Alert.alert("Success", "Astrologer rejected!");
      fetchAstrologers();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to reject astrologer");
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this astrologer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) return;
              await apiAdminDeleteAstrologer(token, id);
              Alert.alert("Success", "Astrologer deleted!");
              fetchAstrologers();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete astrologer");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  if (astrologers.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No astrologers found</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Astrologer }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {item.profilePic ? (
          <Image source={{ uri: item.profilePic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.naText}>N/A</Text>
          </View>
        )}
        <Text style={styles.name}>{item.name}</Text>
      </View>

      <Text style={styles.text}><Text style={styles.bold}>Bio:</Text> {item.bio}</Text>
      <Text style={styles.text}><Text style={styles.bold}>Skills:</Text> {item.skills.join(", ")}</Text>
      <Text style={styles.text}><Text style={styles.bold}>Languages:</Text> {item.languages.join(", ")}</Text>
      <Text style={styles.text}>Price/Min: ₹{item.pricePerMinute}</Text>
      <Text style={styles.text}>Experience: {item.experience} yrs</Text>

      <Text
        style={[
          styles.status,
          item.isApproved === "approved"
            ? styles.approved
            : styles.pending,
        ]}
      >
        Status: {item.isApproved}
      </Text>

      <View style={styles.actionRow}>
        {item.isApproved === "pending" && (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.approveBtn]}
              onPress={() => handleApprove(item._id)}
            >
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={() => handleReject(item._id)}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.btn, styles.deleteBtn]}
          onPress={() => handleDelete(item._id)}
        >
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>

       <TouchableOpacity
  style={[styles.btn, { backgroundColor: "#e0c878" }]}
  onPress={() =>
    router.push({
      pathname: "/admindashboard/AdminSettlementScreen",
      params: { astrologerId: item._id },
    })
  }
>
  <Text style={styles.btnText}>View Settlement</Text>
</TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={astrologers}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  emptyText: {
    fontSize: 18,
    color: "#6b7280",
  },

  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },

  list: {
    padding: 16,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },

  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  naText: {
    color: "#4b5563",
    fontWeight: "600",
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d1e3f",
  },

  text: {
    fontSize: 14,
    marginTop: 2,
    color: "#111827",
  },

  bold: {
    fontWeight: "600",
  },

  status: {
    marginTop: 6,
    fontWeight: "700",
  },

  approved: {
    color: "#16a34a",
  },

  pending: {
    color: "#a16207",
  },

  actionRow: {
    flexDirection: "row",
    marginTop: 12,
    flexWrap: "wrap",
  },

  btn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 8,
  },

  approveBtn: {
    backgroundColor: "#16a34a",
  },

  rejectBtn: {
    backgroundColor: "#dc2626",
  },

  deleteBtn: {
    backgroundColor: "#4b5563",
  },

  btnText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
