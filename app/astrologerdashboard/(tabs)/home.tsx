import React, { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator, TouchableOpacity, Alert, Modal,StyleSheet } from "react-native";
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
      <ActivityIndicator size="large" color="#e0c878" />
      <Text style={styles.loadingText}>Loading Dashboard...</Text>
    </View>
  );
}

return (
  <View style={styles.container}>
    {/* Header */}
    <View style={styles.header}>
      <Text style={styles.welcome}>Welcome</Text>
      <Text style={styles.username}>{user?.name || "Astrologer"}</Text>
    </View>

    {/* Earnings Card */}
    <View style={styles.card}>
  <Text style={styles.cardTitle}>Earnings Overview</Text>

  {loadingEarnings ? (
    <ActivityIndicator size="small" color="#e0c878" />
  ) : (
    <>
      <Text style={styles.earnings}>₹ {earnings.toFixed(2)}</Text>

      <View style={{ marginTop: 15 }}>
        <Text style={{ color: "#cccccc" }}>Total Paid</Text>
        <Text style={{ color: "#4ade80", fontWeight: "bold", fontSize: 18 }}>
          ₹ {totalPaid.toFixed(2)}
        </Text>
      </View>

      <View style={{ marginTop: 10 }}>
        <Text style={{ color: "#cccccc" }}>Pending Amount</Text>
        <Text style={{ color: "#facc15", fontWeight: "bold", fontSize: 18 }}>
          ₹ {pendingAmount.toFixed(2)}
        </Text>
      </View>
        <TouchableOpacity
    onPress={() => router.push("/astrologerdashboard/settlement-history")}
    style={styles.detailsButton}
  >
    <Text style={styles.detailsText}>View Details</Text>
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
            availability === "online"
              ? styles.online
              : styles.offline,
          ]}
        >
          {availability === "online" ? "● Online" : "● Offline"}
        </Text>

        <TouchableOpacity
          onPress={toggleAvailability}
          disabled={updating}
          style={[
            styles.toggleButton,
            availability === "online"
              ? styles.offlineButton
              : styles.onlineButton,
          ]}
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
    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>

  
  </View>
);
};

export default UserHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a102b",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1a102b",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#e0c878",
    marginTop: 15,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    marginBottom: 30,
  },
  welcome: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },
  username: {
    fontSize: 20,
    color: "#e0c878",
    marginTop: 6,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#3c2a52",
    padding: 25,
    borderRadius: 20,
    marginBottom: 25,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 1,
  },
  earnings: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#e0c878",
    textAlign: "center",
  },
  statusCard: {
    backgroundColor: "#2d1e3f",
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  statusLabel: {
    color: "#aaaaaa",
    fontSize: 14,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  online: {
    color: "#4ade80",
  },
  offline: {
    color: "#f87171",
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
  },
  onlineButton: {
    backgroundColor: "#22c55e",
  },
  offlineButton: {
    backgroundColor: "#ef4444",
  },
  toggleButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#e0c878",
    paddingVertical: 15,
    borderRadius: 20,
  },
  logoutText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    color: "#1a102b",
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
  detailsButton: {
  marginTop: 15,
  paddingVertical: 8,
  borderRadius: 10,
  backgroundColor: "#e0c878",
  alignItems: "center",
},

detailsText: {
  color: "#1a102b",
  fontWeight: "bold",
},
});