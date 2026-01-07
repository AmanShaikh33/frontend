// app/astrologerdashboard/chatlist.tsx

import React, { useEffect, useState, useRef } from "react";
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
import { apiGetUserChats, apiGetMyProfile } from "../../../api/api";
import { socket } from "../../../lib/socket";

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

  const hasRegisteredOnline = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // 1️⃣ Fetch astrologer profile
      const profile = await apiGetMyProfile(token);
      const astrologerId = profile._id;

      // 2️⃣ Register astrologer ONLINE (ONLY ONCE PER SOCKET)
      if (!hasRegisteredOnline.current) {
        socket.emit("astrologerOnline", { astrologerId });
        hasRegisteredOnline.current = true;
      }

      // 3️⃣ Listen for incoming chat requests
      socket.on("incomingChatRequest", (data) => {
        console.log("🔥 CHAT REQUEST RECEIVED:", data);
        setIncomingRequest(data);
        setHighlightUser(data.userId);
        Vibration.vibrate(400);
        refreshChats(token);
      });

      await refreshChats(token);
      setLoading(false);
    };

    init();

    return () => {
      socket.off("incomingChatRequest");
    };
  }, []);

  const refreshChats = async (token: string) => {
    const res = await apiGetUserChats(token);
    setChats(res);
  };

  const openChat = (userId: string) => {
    setHighlightUser(null);
    router.push(`/astrologerdashboard/chatpage?userId=${userId}`);
  };

  const acceptChat = () => {
    if (!incomingRequest) return;
    openChat(incomingRequest.userId);
    setIncomingRequest(null);
  };

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
