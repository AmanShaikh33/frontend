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
  const [selectedAstro, setSelectedAstro] =
    useState<AstrologerType | null>(null);

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
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#e0c878"
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>Chat</Text>
        </View>

        {/* ASTROLOGER LIST */}
        <View style={styles.listContainer}>
          {astrologers.length === 0 ? (
            <Text style={styles.emptyText}>
              No approved astrologers available.
            </Text>
          ) : (
            astrologers.map((astro) => {
              console.log("Astrologer:", astro.name, "Status:", astro.availability);
              return (
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
              );
            })
          )}
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
              >
                <Text>Cancel</Text>
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
  container: {
    flex: 1,
    position: "relative",
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
    marginRight: 24,
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
    padding: 20,
    borderRadius: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  modalText: {
    textAlign: "center",
    marginVertical: 10,
    fontSize: 16,
  },

  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  cancelBtn: {
    padding: 10,
    backgroundColor: "#ccc",
    borderRadius: 8,
  },

  proceedBtn: {
    padding: 10,
    backgroundColor: "#e0c878",
    borderRadius: 8,
  },
});
