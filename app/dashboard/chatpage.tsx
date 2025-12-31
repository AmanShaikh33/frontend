// app/dashboard/chatpage.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import jwtDecode from "jwt-decode";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  StyleSheet,
} from "react-native";
import { io, Socket } from "socket.io-client";
import { apiCreateOrGetChatRoom, apiGetMessages } from "../../api/api";

const SOCKET_URL = "https://astro-backend-qdu5.onrender.com";

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
}

export default function UserChatPage() {
  const { astrologerId } = useLocalSearchParams<{ astrologerId: string }>();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoomId, setChatRoomId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [astroJoined, setAstroJoined] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("userData");
      if (!token || !userStr || !astrologerId) return;

      const decoded: any = jwtDecode(token);
      setUserId(decoded.id);

      const room = await apiCreateOrGetChatRoom(token, astrologerId);
      const roomId = room._id;
      setChatRoomId(roomId);

      const socket = io(SOCKET_URL, { transports: ["websocket"] });
      socketRef.current = socket;

      socket.emit("joinRoom", { roomId });

      socket.emit("requestChat", {
        roomId,
        astrologerId,
        userId: decoded.id,
        userName: JSON.parse(userStr).name,
      });

      socket.emit("participant-joined", {
        roomId,
        role: "user",
      });

      socket.on("participant-joined", ({ role }) => {
        if (role === "astrologer") setAstroJoined(true);
      });

      socket.on("receiveMessage", (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
      });

      const msgs = await apiGetMessages(token, roomId);
      setMessages(msgs);
    };

    init();

    return () => socketRef.current?.disconnect();
  }, [astrologerId]);

  const sendMessage = () => {
    if (!astroJoined) {
      Alert.alert("Waiting", "Astrologer has not joined yet.");
      return;
    }

    if (!newMessage.trim()) return;

    socketRef.current?.emit("sendMessage", {
      chatRoomId,
      senderId: userId,
      receiverId: astrologerId,
      content: newMessage,
    });

    setNewMessage("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>
        {astroJoined ? "Astrologer Connected" : "Waiting for astrologer..."}
      </Text>

      <FlatList
        data={messages}
        keyExtractor={(i, idx) => i._id ?? idx.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.msg,
              item.senderId === userId ? styles.mine : styles.theirs,
            ]}
          >
            <Text>{item.content}</Text>
          </View>
        )}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          editable={astroJoined}
        />
        <TouchableOpacity onPress={sendMessage} disabled={!astroJoined}>
          <Text style={styles.send}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 10, fontWeight: "bold" },
  msg: { padding: 10, margin: 5, borderRadius: 10 },
  mine: { backgroundColor: "#DCF8C6", alignSelf: "flex-end" },
  theirs: { backgroundColor: "#EEE", alignSelf: "flex-start" },
  inputBar: { flexDirection: "row", padding: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10 },
  send: { marginLeft: 10, color: "blue", fontWeight: "bold" },
});
