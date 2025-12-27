import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Vibration,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGetUserChats } from "../../../api/api";
import { io } from "socket.io-client";

const socket = io("https://astrologyapp-1.onrender.com", { transports: ["websocket"] });

interface ChatPreview {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  lastMessage: string;
  updatedAt: string;
}

export default function ChatListPage() {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ⭐ NEW STATE
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [newUserHighlight, setNewUserHighlight] = useState<string | null>(null);

  const router = useRouter();

  // ------------------------------
  // FETCH EXISTING CHATS
  // ------------------------------
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setError("No token found. Please log in again.");
          return;
        }

        const res = await apiGetUserChats(token);
        setChats(res);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  // ------------------------------
  // SOCKET: LISTEN FOR NEW CHAT REQUEST
  // ------------------------------
  useEffect(() => {
    socket.on("incomingChatRequest", (data) => {
      console.log("🔥 New chat request:", data);

      setIncomingRequest(data);
      setNewUserHighlight(data.userId);

      // Vibrate device
      Vibration.vibrate(500);

      // Auto refresh chat list
      refreshChats();
    });

    return () => socket.off("incomingChatRequest");
  }, []);

  // Refresh function for new requests
  const refreshChats = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    const res = await apiGetUserChats(token);
    setChats(res);
  };

  // ------------------------------
  // OPEN CHAT
  // ------------------------------
  const handleOpenChat = (userId: string, userName: string) => {
    router.push(`/astrologerdashboard/chatpage?userId=${userId}`);

    // After clicking, remove highlight
    if (newUserHighlight === userId) {
      setNewUserHighlight(null);
    }
  };

  // ------------------------------
  // ACCEPT CHAT (FROM POPUP)
  // ------------------------------
  const acceptChat = () => {
    if (!incomingRequest) return;

    router.push(
      `/astrologerdashboard/chatpage?userId=${incomingRequest.userId}`
    );

    setIncomingRequest(null);
  };

  // ------------------------------
  // UI
  // ------------------------------
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Chats</Text>

      {/* ⭐ Incoming Request Modal */}
      <Modal visible={!!incomingRequest} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Chat Request!</Text>
            <Text style={styles.modalUser}>
              User: {incomingRequest?.userName}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={acceptChat}
              >
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.laterBtn}
                onPress={() => setIncomingRequest(null)}
              >
                <Text style={styles.laterText}>Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat List */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isNew = newUserHighlight === item.user._id;

          return (
            <TouchableOpacity
              style={[
                styles.chatItem,
                isNew && { backgroundColor: "#ffeeb0" }, // ⭐ highlight new chat
              ]}
              onPress={() => handleOpenChat(item.user._id, item.user.name)}
            >
              <Ionicons
                name="person-circle-outline"
                size={42}
                color="#2d1e3f"
              />

              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.name}>{item.user.name}</Text>

                  {isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.badgeText}>NEW</Text>
                    </View>
                  )}
                </View>

                <Text numberOfLines={1} style={styles.message}>
                  {item.lastMessage || "No messages yet"}
                </Text>
              </View>

              <Ionicons
                name="chatbox-outline"
                size={22}
                color="#9e8b4e"
              />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2d1e3f",
    marginBottom: 15,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d1e3f",
  },
  message: {
    fontSize: 14,
    color: "#555",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 30,
  },
  modalBox: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d1e3f",
    marginBottom: 10,
  },
  modalUser: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  acceptBtn: {
    backgroundColor: "#2d1e3f",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  acceptText: {
    color: "white",
    fontSize: 16,
  },
  laterBtn: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  laterText: {
    color: "#2d1e3f",
    fontSize: 16,
  },

  newBadge: {
    backgroundColor: "#e0c878",
    marginLeft: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: "#2d1e3f",
    fontWeight: "bold",
    fontSize: 10,
  },
});
