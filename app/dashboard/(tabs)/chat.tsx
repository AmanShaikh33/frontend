import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
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

export default function Chat() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [astrologers, setAstrologers] = useState<AstrologerType[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAstro, setSelectedAstro] = useState<AstrologerType | null>(null);

  useEffect(() => {
    const fetchAstrologers = async () => {
      try {
        const data = await apiGetApprovedAstrologers();
        setAstrologers(data);
      } catch (err: any) {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#2d1e3f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {astrologers.length === 0 ? (
            <Text style={styles.emptyText}>No approved astrologers available.</Text>
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
      </ScrollView>

      {modalVisible && selectedAstro && (
        <BlurView intensity={40} tint="dark" style={styles.blur}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{selectedAstro.name}</Text>
            <Text style={styles.modalText}>₹{selectedAstro.pricePerMinute}/min</Text>

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
  container: {
    flex: 1,
    backgroundColor: "#f7f5f0",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2d1e3f",
  },

  errorText: {
    color: "#e0672c",
    fontSize: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2d1e3f",
    paddingTop: 50,
    padding: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  backBtn: {
    backgroundColor: "#e0c878",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fdf6ec",
  },

  listContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 24,
    color: "#a89f8c",
    fontSize: 15,
  },

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

  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
    color: "#2d1e3f",
  },

  modalText: {
    textAlign: "center",
    marginVertical: 10,
    color: "#8a7f6a",
  },

  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },

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