import React, { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator, TouchableOpacity, Alert, Modal, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { apiUpdateAvailability, apiGetAstrologerEarnings, apiGetMyProfile } from "../../../api/api";
import { socket } from "../../../lib/socket";

const UserHome = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<"online" | "offline">("offline");
  const [updating, setUpdating] = useState(false);
  const [earnings, setEarnings] = useState<number>(0);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [astrologerDocId, setAstrologerDocId] = useState("");
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [pendingAmount, setPendingAmount] = useState<number>(0);

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
      
        // FIRST check profile
let astroProfile;

try {
  astroProfile = await apiGetMyProfile(token);
} catch (err) {
  console.log("No astrologer profile. Redirecting...");
  router.replace("/astrologerdashboard/(tabs)/astroform");
  return; // STOP EXECUTION
}

if (!astroProfile || !astroProfile._id) {
  router.replace("/astrologerdashboard/(tabs)/astroform");
  return;
}

setAstrologerDocId(astroProfile._id);

// ONLY NOW load earnings
await loadEarnings(token);
        
       
        const decoded: any = jwtDecode(token);
        console.log("🔌 Connecting astrologer to socket with ID:", decoded.id);
        
        if (!socket.connected) {
          socket.connect();
        }
        
        socket.emit("astrologerOnline", { astrologerId: decoded.id });
        
      

        
        socket.on("minute-billed", ({ astrologerEarnings }) => {
  setEarnings(astrologerEarnings);
  setPendingAmount(astrologerEarnings - totalPaid);
});
        
      } catch (err) {
        console.error(err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    
    return () => {
 
      socket.off("minute-billed");
    };
  }, []);

  const loadEarnings = async (token: string) => {
  setLoadingEarnings(true);
  try {
    const response = await apiGetAstrologerEarnings(token);

    setEarnings(response.totalEarnings || 0);
    setTotalPaid(response.totalPaid || 0);
    setPendingAmount(response.pendingAmount || 0);

  } catch (error: any) {
    console.error("Failed to load earnings:", error);
  } finally {
    setLoadingEarnings(false);
  }
};

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

     
      if (newStatus === "online" && user) {
        const decoded: any = jwtDecode(token);
        socket.emit("astrologerOnline", { astrologerId: decoded.id }); // Use user ID
      }

    
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
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#e0672c" />
      <Text style={styles.loadingText}>Loading Dashboard...</Text>
    </View>
  );
}

return (
  <View style={styles.container}>
    {/* Header */}
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <View>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.username}>{user?.name || "Astrologer"}</Text>
        </View>
        <View style={[styles.statusDotBadge, availability === "online" ? styles.statusDotOnline : styles.statusDotOffline]}>
          <View style={[styles.statusDot, availability === "online" ? styles.dotOnline : styles.dotOffline]} />
          <Text style={styles.statusDotText}>{availability === "online" ? "Online" : "Offline"}</Text>
        </View>
      </View>
    </View>

    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Earnings Card */}
      <View style={styles.card}>
        <View style={styles.cardIconBadge}>
          <Ionicons name="cash-outline" size={20} color="#2d1e3f" />
        </View>
        <Text style={styles.cardTitle}>EARNINGS OVERVIEW</Text>

        {loadingEarnings ? (
          <ActivityIndicator size="small" color="#e0672c" />
        ) : (
          <>
            <Text style={styles.earnings}>₹ {earnings.toFixed(2)}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total Paid</Text>
                <Text style={styles.statValuePaid}>₹ {totalPaid.toFixed(2)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statValuePending}>₹ {pendingAmount.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/astrologerdashboard/settlement-history")}
              style={styles.detailsButton}
              activeOpacity={0.85}
            >
              <Text style={styles.detailsText}>View Details</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Availability Card */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status</Text>

        <View style={styles.statusRow}>
          <Text
            style={[
              styles.statusText,
              availability === "online" ? styles.online : styles.offline,
            ]}
          >
            {availability === "online" ? "● Online" : "● Offline"}
          </Text>

          <TouchableOpacity
            onPress={toggleAvailability}
            disabled={updating}
            style={[
              styles.toggleButton,
              availability === "online" ? styles.offlineButton : styles.onlineButton,
            ]}
            activeOpacity={0.85}
          >
            <Text style={styles.toggleButtonText}>
              {updating
                ? "Updating..."
                : availability === "online"
                ? "Go Offline"
                : "Go Online"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color="#2d1e3f" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
);
};

export default UserHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f5f0",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f7f5f0",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#8a7f6a",
    marginTop: 15,
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#2d1e3f",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  welcome: {
    fontSize: 13,
    color: "#b7a9c9",
  },
  username: {
    fontSize: 22,
    color: "#e0c878",
    marginTop: 4,
    fontWeight: "700",
  },
  statusDotBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusDotOnline: { backgroundColor: "rgba(74,222,128,0.15)" },
  statusDotOffline: { backgroundColor: "rgba(248,113,113,0.15)" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotOnline: { backgroundColor: "#4ade80" },
  dotOffline: { backgroundColor: "#f87171" },
  statusDotText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  scrollContent: { padding: 20, paddingBottom: 60 },

  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 22,
    marginBottom: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0ebe0",
    shadowColor: "#2d1e3f",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3e8c9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    color: "#a89f8c",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 1,
    fontWeight: "600",
  },
  earnings: {
    fontSize: 34,
    fontWeight: "800",
    color: "#2d1e3f",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  statBox: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 34, backgroundColor: "#f0ebe0" },
  statLabel: { color: "#a89f8c", fontSize: 12, marginBottom: 4 },
  statValuePaid: { color: "#2f9e44", fontWeight: "700", fontSize: 17 },
  statValuePending: { color: "#e0a800", fontWeight: "700", fontSize: 17 },

  detailsButton: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: "#e0672c",
    alignSelf: "stretch",
  },
  detailsText: {
    color: "#fff",
    fontWeight: "700",
  },

  statusCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f0ebe0",
  },
  statusLabel: {
    color: "#a89f8c",
    fontSize: 12,
    marginBottom: 12,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: 17,
    fontWeight: "700",
  },
  online: {
    color: "#2f9e44",
  },
  offline: {
    color: "#d9480f",
  },
  toggleButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
  },
  onlineButton: {
    backgroundColor: "#2f9e44",
  },
  offlineButton: {
    backgroundColor: "#d9480f",
  },
  toggleButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f3e8c9",
    paddingVertical: 15,
    borderRadius: 22,
  },
  logoutText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#2d1e3f",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#2d1e3f",
    width: "100%",
    borderRadius: 20,
    padding: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#e0c878",
    textAlign: "center",
    marginBottom: 15,
  },
  modalText: {
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  reject: {
    backgroundColor: "#ef4444",
  },
  accept: {
    backgroundColor: "#22c55e",
  },
  modalButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});