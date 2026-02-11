import React, { useEffect, useRef, useState } from "react";
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
import { socket } from "../../../lib/socket";
import {
  apiGetUserChats,
  apiGetMyProfile,
} from "../../../api/api";

interface ChatPreview {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  lastMessage?: string;
}

export default function AstrologerChatList() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);

  const hasRegisteredOnline = useRef(false);

  /* ===============================
     🔌 INIT + SOCKET (SAFE)
  =============================== */
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token || !isMounted) return;

      // Connect socket if not connected
      if (!socket.connected) {
        socket.connect();
      }

      // Get astrologer profile
      const profile = await apiGetMyProfile(token);
      const astrologerId = profile._id;

      // Register astrologer online (ONCE)
      if (!hasRegisteredOnline.current) {
        socket.emit("astrologerOnline", { astrologerId });
        hasRegisteredOnline.current = true;
        console.log("🟢 Astrologer registered online:", astrologerId);
      }

      // 🔥 CRITICAL FIX:
      // Remove any existing listener before adding a new one
      socket.off("incomingChatRequest");

      socket.on("incomingChatRequest", (data) => {
        console.log("🔥 INCOMING CHAT REQUEST:", data);
        setIncomingRequest(data);
        Vibration.vibrate(400);
      });

      await refreshChats(token);
      setLoading(false);
    };

    init();

    return () => {
      isMounted = false;
      socket.off("incomingChatRequest");
    };
  }, []);

  const refreshChats = async (token: string) => {
    const res = await apiGetUserChats(token);
    setChats(res);
  };

  const acceptChat = () => {
    if (!incomingRequest) return;
    console.log("✅ Astrologer accepting chat request:", incomingRequest.requestId);
    
    // Emit acceptance to backend
    socket.emit("astrologerAcceptsChat", {
      requestId: incomingRequest.requestId,
      userId: incomingRequest.userId,
    });
    
    const userId = incomingRequest.userId;
    const requestId = incomingRequest.requestId;
    setIncomingRequest(null);
    router.push(`/astrologerdashboard/chatpage?userId=${userId}&requestId=${requestId}`);
  };

  const rejectChat = () => {
    setIncomingRequest(null);
  };

  /* ===============================
     🖼️ UI
  =============================== */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chats</Text>

      {/* 🔔 INCOMING REQUEST MODAL */}
      <Modal visible={!!incomingRequest} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>New Chat Request</Text>
            <Text style={styles.subtitle}>
              User: {incomingRequest?.userName}
            </Text>

            <View style={styles.row}>
              <TouchableOpacity style={styles.accept} onPress={acceptChat}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.reject} onPress={rejectChat}>
                <Text>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📃 CHAT LIST */}
      <FlatList
        data={chats}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => (
          <View style={styles.chatItem}>
            <Ionicons name="person-circle-outline" size={42} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.name}>{item.user.name}</Text>
              <Text numberOfLines={1} style={styles.preview}>
                {item.lastMessage || "No messages yet"}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

/* ===============================
   🎨 STYLES
=============================== */
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 15 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  chatItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f3f3f3",
    marginBottom: 10,
    alignItems: "center",
  },

  name: { fontWeight: "bold", fontSize: 16 },
  preview: { fontSize: 12, color: "#555" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 30,
  },

  modal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },

  title: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  subtitle: { marginBottom: 15 },

  row: { flexDirection: "row", justifyContent: "space-between" },

  accept: {
    backgroundColor: "#2d1e3f",
    padding: 10,
    borderRadius: 8,
  },

  acceptText: {
    color: "white",
    fontWeight: "bold",
  },

  reject: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 8,
  },
});
