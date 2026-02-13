import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import AstrologerComponent from "../../../components/astrologercomponents";
import {
  apiGetApprovedAstrologers,
  apiGetWalletBalance,
} from "../../../api/api";
import { BlurView } from "expo-blur";
import { socket } from "../../../lib/socket";
import { jwtDecode } from "jwt-decode";

type AstrologerType = {
  _id: string;
  name: string;
  bio?: string;
  skills: any;
  languages: any;
  experience: string;
  pricePerMinute: number;
  oldPrice?: number;
  orders?: number;
  availability: string;
  waitTime?: string;
  profilePic?: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [astrologers, setAstrologers] = useState<AstrologerType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAstro, setSelectedAstro] = useState<any>(null);

  const fetchWallet = async (userId: string) => {
    try {
      const res = await apiGetWalletBalance(userId);
      if (res.success) setWalletBalance(res.balance);
    } catch (err) {
      console.log("Wallet fetch error:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = await AsyncStorage.getItem("userData");
        const token = await AsyncStorage.getItem("token");

        if (!userStr || !token) {
          router.replace("/login");
          return;
        }

        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);

        await fetchWallet(parsedUser._id);

        const data = await apiGetApprovedAstrologers();
        setAstrologers(data);

        // Connect socket and listen for real-time coin updates
        if (!socket.connected) {
          socket.connect();
        }

        const decoded: any = jwtDecode(token);
        socket.emit("userOnline", { userId: decoded.id });

        // Listen for minute-billed event to update coins in real-time
        socket.on("minute-billed", ({ coinsLeft }) => {
          console.log("💰 [USER HOME] Coins updated:", coinsLeft);
          setWalletBalance(coinsLeft);
        });

      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      socket.off("minute-billed");
    };
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/login");
  };

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
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.userRow}>
            <Ionicons name="person-circle" size={40} color="#e0c878" />
            <Text style={styles.username}>
              Hi {user?.name || "User"}
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.walletRow}>
          <View style={styles.walletBox}>
            <Text style={styles.walletText}>Coins: {walletBalance}</Text>
          </View>

          <TouchableOpacity
            style={styles.addMoneyBtn}
            onPress={() => router.push("/dashboard/addmoney")}
          >
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#2d1e3f" />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#555"
            style={styles.searchInput}
          />
        </View>

        <Image
          source={{
            uri: "https://img.freepik.com/free-vector/zodiac-astrology-horoscope-banner_1017-31529.jpg",
          }}
          style={styles.banner}
        />

        <View style={styles.list}>
          {astrologers.length === 0 ? (
            <Text style={styles.empty}>No astrologers available.</Text>
          ) : (
            astrologers.map((astro) => (
              <AstrologerComponent
                key={astro._id}
                {...astro}
                status={astro.availability}
                price={astro.pricePerMinute}
                onChatPress={() => {
                  console.log("💆 Chat button clicked for astrologer:", astro._id);
                  setSelectedAstro(astro);
                  setModalVisible(true);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* BLUR MODAL */}
      {modalVisible && selectedAstro && (
        <BlurView intensity={40} tint="dark" style={styles.blur}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{selectedAstro.name}</Text>

            <Text style={styles.modalText}>₹{selectedAstro.pricePerMinute}/min</Text>

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.proceedBtn}
                onPress={() => {
                  console.log("🚀 Proceed clicked, navigating to chat with:", selectedAstro._id);
                  setModalVisible(false);
                  router.push({
                    pathname: "/dashboard/chatpage",
                    params: { astrologerId: selectedAstro._id },
                  });
                }}
              >
                <Text style={{ fontWeight: "bold" }}>Proceed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#2d1e3f" },
  error: { color: "red" },

  header: { backgroundColor: "#2d1e3f", paddingTop: 40, padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  userRow: { flexDirection: "row", alignItems: "center" },
  username: { color: "#e0c878", fontSize: 18, fontWeight: "bold", marginLeft: 8 },

  logoutBtn: { backgroundColor: "#e0c878", padding: 6, borderRadius: 6 },
  logoutText: { color: "#2d1e3f", fontWeight: "600" },

  walletRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  walletBox: { backgroundColor: "#fff", padding: 6, borderRadius: 6 },
  walletText: { fontWeight: "600" },
  addMoneyBtn: { backgroundColor: "#e0c878", padding: 8, borderRadius: 6 },
  addMoneyText: { fontWeight: "600" },

  searchBox: { flexDirection: "row", margin: 16, padding: 10, backgroundColor: "#eee", borderRadius: 20 },
  searchInput: { marginLeft: 8, flex: 1 },

  banner: { height: 160, borderRadius: 12, marginHorizontal: 16 },

  list: { marginTop: 20, paddingHorizontal: 16 },
  empty: { textAlign: "center", color: "#777" },

  blur: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, justifyContent: "center", alignItems: "center" },
  modal: { backgroundColor: "#fff", width: "85%", padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  modalText: { textAlign: "center", marginVertical: 10 },

  modalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  cancelBtn: { padding: 10, backgroundColor: "#ccc", borderRadius: 8 },
  proceedBtn: { padding: 10, backgroundColor: "#e0c878", borderRadius: 8 },
});
