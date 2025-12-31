// app/astrologerdashboard/chatlist.tsx

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
import jwtDecode from "jwt-decode";
import { io, Socket } from "socket.io-client";
import { apiGetUserChats } from "../../../api/api";
import { Ionicons } from "@expo/vector-icons";

const SOCKET_URL = "https://astro-backend-qdu5.onrender.com";

interface ChatPreview {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  lastMessage: string;
}

export default function AstrologerChatList() {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [highlightUser, setHighlightUser] = useState<string | null>(null);

  const router = useRouter();
  const socketRef = React.useRef<Socket | null>(null);

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const decoded: any = jwtDecode(token);

      const socket = io(SOCKET_URL, { transports: ["websocket"] });
      socketRef.current = socket;

      // 🔑 JOIN PERSONAL ASTRO ROOM
      socket.emit("joinAstrologer", {
        astrologerId: decoded.id,
      });

      socket.on("incomingChatRequest", (data) => {
        setIncomingRequest(data);
        setHighlightUser(data.userId);
        Vibration.vibrate(400);
        refreshChats(token);
      });

      await refreshChats(token);
      setLoading(false);
    };

    init();

    return () => socketRef.current?.disconnect();
  }, []);

  /* ---------------- FETCH CHATS ---------------- */
  const refreshChats = async (token: string) => {
    const res = await apiGetUserChats(token);
    setChats(res);
  };

  /* ---------------- OPEN CHAT ---------------- */
  const openChat = (userId: string) => {
    setHighlightUser(null);
    router.push(`/astrologerdashboard/chatpage?userId=${userId}`);
  };

  /* ---------------- ACCEPT MODAL ---------------- */
  const acceptChat = () => {
    if (!incomingRequest) return;
    openChat(incomingRequest.userId);
    setIncomingRequest(null);
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Incoming Chats</Text>

      {/* Modal */}
      <Modal visible={!!incomingRequest} transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>New Chat Request</Text>
            <Text>User: {incomingRequest?.userName}</Text>

            <View style={styles.row}>
              <TouchableOpacity style={styles.accept} onPress={acceptChat}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reject}
                onPress={() => setIncomingRequest(null)}
              >
                <Text>Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={chats}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.chatItem,
              highlightUser === item.user._id && styles.highlight,
            ]}
            onPress={() => openChat(item.user._id)}
          >
            <Ionicons name="person-circle-outline" size={40} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.name}>{item.user.name}</Text>
              <Text numberOfLines={1}>
                {item.lastMessage || "No messages"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 15 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  chatItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f3f3f3",
    marginBottom: 10,
    alignItems: "center",
  },
  highlight: { backgroundColor: "#ffe7a0" },
  name: { fontWeight: "bold" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 30,
  },
  modal: { backgroundColor: "#fff", padding: 20, borderRadius: 12 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },

  accept: {
    backgroundColor: "#2d1e3f",
    padding: 10,
    borderRadius: 8,
  },
  acceptText: { color: "white", fontWeight: "bold" },
  reject: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 8,
  },
});
