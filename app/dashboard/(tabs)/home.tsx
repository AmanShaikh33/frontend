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

        if (!socket.connected) {
          socket.connect();
        }

        const decoded: any = jwtDecode(token);
        socket.emit("userOnline", { userId: decoded.id });

        socket.on("minute-billed", ({ coinsLeft }) => {
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

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.userRow}>
            <Ionicons name="person-circle" size={42} color="#e0c878" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.username}>Hello, {user?.name || "User"} 👋</Text>
              <Text style={styles.subGreeting}>Find your guidance today</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} hitSlop={10}>
            <Ionicons name="log-out-outline" size={20} color="#2d1e3f" />
          </TouchableOpacity>
        </View>

        <View style={styles.walletRow}>
          <View style={styles.walletBox}>
            <Ionicons name="wallet-outline" size={16} color="#2d1e3f" />
            <Text style={styles.walletText}>₹ {walletBalance}</Text>
          </View>

          <TouchableOpacity
            style={styles.addMoneyBtn}
            onPress={() => router.push("/dashboard/addmoney")}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={16} color="#2d1e3f" />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#8a7f6a" />
          <TextInput
            placeholder="Search astrologers, services..."
            placeholderTextColor="#a89f8c"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.promoBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Your First Chat is FREE</Text>
            <Text style={styles.promoSubtitle}>Talk to an expert now</Text>
          </View>
          <View style={styles.promoIconBadge}>
            <Ionicons name="gift-outline" size={26} color="#e0672c" />
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Popular Astrologers</Text>
        </View>

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
                onPress={() => {
                  router.push({
                    pathname: "/dashboard/astrologer-details",
                    params: { astrologerId: astro._id },
                  });
                }}
                onChatPress={() => {
                  setSelectedAstro(astro);
                  setModalVisible(true);
                }}
              />
            ))
          )}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("/dashboard/horoscope")}
            activeOpacity={0.85}
          >
            <View style={styles.quickIconBadge}>
              <Ionicons name="planet-outline" size={22} color="#2d1e3f" />
            </View>
            <Text style={styles.quickText}>Horoscope</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("/dashboard/freekundli")}
            activeOpacity={0.85}
          >
            <View style={styles.quickIconBadge}>
              <Ionicons name="document-text-outline" size={22} color="#2d1e3f" />
            </View>
            <Text style={styles.quickText}>Free Kundli</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("/dashboard/matchkundli")}
            activeOpacity={0.85}
          >
            <View style={styles.quickIconBadge}>
              <Ionicons name="heart-circle-outline" size={22} color="#2d1e3f" />
            </View>
            <Text style={styles.quickText}>Match Kundli</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {modalVisible && selectedAstro && (
        <BlurView intensity={40} tint="dark" style={styles.blur}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{selectedAstro.name}</Text>
            <Text style={styles.modalText}>
              ₹{selectedAstro.pricePerMinute}/min
            </Text>

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.proceedBtn}
                onPress={() => {
                  setModalVisible(false);
                  router.push({
                    pathname: "/dashboard/chatpage",
                    params: { astrologerId: selectedAstro._id },
                  });
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.proceedBtnText}>Proceed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2d1e3f",
  },
  error: { color: "#e0672c" },

  header: {
    backgroundColor: "#2d1e3f",
    paddingTop: 50,
    padding: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  userRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  username: {
    color: "#fdf6ec",
    fontSize: 16,
    fontWeight: "700",
  },
  subGreeting: {
    color: "#b7a9c9",
    fontSize: 12,
    marginTop: 2,
  },

  logoutBtn: {
    backgroundColor: "#e0c878",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  walletRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  walletBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  walletText: { fontWeight: "700", color: "#2d1e3f" },
  addMoneyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e0c878",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  addMoneyText: { fontWeight: "700", color: "#2d1e3f", fontSize: 12 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginTop: 20,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eee0bd",
    gap: 8,
  },
  searchInput: { flex: 1, color: "#2d1e3f" },

  promoBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#2d1e3f",
  },
  promoTitle: { color: "#e0c878", fontWeight: "700", fontSize: 15, marginBottom: 2 },
  promoSubtitle: { color: "#b7a9c9", fontSize: 12 },
  promoIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#fdf6ec",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#2d1e3f" },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  quickCard: {
    alignItems: "center",
    width: 90,
  },
  quickIconBadge: {
    backgroundColor: "#fff",
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee0bd",
    marginBottom: 8,
    shadowColor: "#2d1e3f",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  quickText: {
    fontWeight: "600",
    color: "#2d1e3f",
    textAlign: "center",
    fontSize: 12,
  },

  list: { marginTop: 4, paddingHorizontal: 16 },
  empty: { textAlign: "center", color: "#a89f8c" },

  blur: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 22,
    borderRadius: 20,
  },
  modalTitle: { fontSize: 19, fontWeight: "700", textAlign: "center", color: "#2d1e3f" },
  modalText: { textAlign: "center", marginVertical: 10, color: "#8a7f6a" },

  modalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 12 },
  cancelBtn: {
    flex: 1,
    padding: 13,
    backgroundColor: "#f2efe8",
    borderRadius: 24,
    alignItems: "center",
  },
  cancelBtnText: { color: "#5c5347", fontWeight: "700" },
  proceedBtn: {
    flex: 1,
    padding: 13,
    backgroundColor: "#e0672c",
    borderRadius: 24,
    alignItems: "center",
  },
  proceedBtnText: { color: "#fff", fontWeight: "700" },
});