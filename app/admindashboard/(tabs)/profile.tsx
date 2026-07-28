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
import { Ionicons } from "@expo/vector-icons";
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
        <ActivityIndicator size="large" color="#e0672c" />
      </View>
    );
  }

  if (astrologers.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="people-outline" size={40} color="#c2b280" />
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
            <Ionicons name="person-outline" size={20} color="#a3915a" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <View
            style={[
              styles.statusPill,
              item.isApproved === "approved" ? styles.approvedPill : styles.pendingPill,
            ]}
          >
            <Ionicons
              name={item.isApproved === "approved" ? "checkmark-circle" : "time-outline"}
              size={12}
              color={item.isApproved === "approved" ? "#2f9e44" : "#e0a800"}
            />
            <Text
              style={[
                styles.statusText,
                { color: item.isApproved === "approved" ? "#2f9e44" : "#e0a800" },
              ]}
            >
              {item.isApproved}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.text}><Text style={styles.bold}>Bio:</Text> {item.bio}</Text>
        <Text style={styles.text}><Text style={styles.bold}>Skills:</Text> {item.skills.join(", ")}</Text>
        <Text style={styles.text}><Text style={styles.bold}>Languages:</Text> {item.languages.join(", ")}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="cash-outline" size={12} color="#8a7f6a" />
            <Text style={styles.metaText}>₹{item.pricePerMinute}/min</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="ribbon-outline" size={12} color="#8a7f6a" />
            <Text style={styles.metaText}>{item.experience} yrs</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        {item.isApproved === "pending" && (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.approveBtn]}
              onPress={() => handleApprove(item._id)}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={() => handleReject(item._id)}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={14} color="#fff" />
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.btn, styles.deleteBtn]}
          onPress={() => handleDelete(item._id)}
          activeOpacity={0.85}
        >
          <Ionicons name="trash-outline" size={14} color="#fff" />
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>

       <TouchableOpacity
          style={[styles.btn, styles.settlementBtn]}
          onPress={() =>
            router.push({
              pathname: "/admindashboard/AdminSettlementScreen",
              params: { astrologerId: item._id },
            })
          }
          activeOpacity={0.85}
        >
          <Ionicons name="receipt-outline" size={14} color="#2d1e3f" />
          <Text style={styles.btnTextDark}>Settlement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Manage Astrologers</Text>
        <Text style={styles.headerSubtitle}>{astrologers.length} total</Text>
      </View>

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
    backgroundColor: "#f7f5f0",
  },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f5f0",
    gap: 10,
  },

  emptyText: {
    fontSize: 15,
    color: "#a89f8c",
  },

  container: {
    flex: 1,
    backgroundColor: "#f7f5f0",
  },

  headerBar: {
    backgroundColor: "#2d1e3f",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#e0c878" },
  headerSubtitle: { fontSize: 12, color: "#b7a9c9", marginTop: 4 },

  list: {
    padding: 16,
    paddingBottom: 60,
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f0ebe0",
    shadowColor: "#2d1e3f",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fffdf7",
    borderWidth: 1,
    borderColor: "#eee0bd",
    justifyContent: "center",
    alignItems: "center",
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2d1e3f",
    marginBottom: 4,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  approvedPill: { backgroundColor: "#eafbea" },
  pendingPill: { backgroundColor: "#fff6e0" },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },

  infoBlock: {
    backgroundColor: "#fbf9f4",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },

  text: {
    fontSize: 13,
    marginTop: 2,
    color: "#5c5347",
  },

  bold: {
    fontWeight: "700",
    color: "#2d1e3f",
  },

  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee0bd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  metaText: { fontSize: 11, color: "#8a7f6a" },

  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },

  approveBtn: {
    backgroundColor: "#2f9e44",
  },

  rejectBtn: {
    backgroundColor: "#d9480f",
  },

  deleteBtn: {
    backgroundColor: "#5c5347",
  },

  settlementBtn: {
    backgroundColor: "#f3e8c9",
  },

  btnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  btnTextDark: {
    color: "#2d1e3f",
    fontWeight: "700",
    fontSize: 12,
  },
});