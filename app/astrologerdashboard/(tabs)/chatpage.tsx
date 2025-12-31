// app/astrologerdashboard/chatpage.tsx

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
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwtDecode from "jwt-decode";
import { io, Socket } from "socket.io-client";
import {
  apiCreateOrGetChatRoom,
  apiGetMessages,
} from "../../../api/api";

const SOCKET_URL = "https://astro-backend-qdu5.onrender.com";

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
}

export default function AstrologerChatPage() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoomId, setChatRoomId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [astrologerId, setAstrologerId] = useState("");
  const [userJoined, setUserJoined] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token || !userId) return;

      const decoded: any = jwtDecode(token);
      setAstrologerId(decoded.id);

      const room = await apiCreateOrGetChatRoom(token, null, userId);
      const roomId = room._id;
      setChatRoomId(roomId);

      const socket = io(SOCKET_URL, { transports: ["websocket"] });
      socketRef.current = socket;

      socket.emit("joinRoom", { roomId });

      socket.emit("participant-joined", {
        roomId,
        role: "astrologer",
      });

      socket.on("participant-joined", ({ role }) => {
        if (role === "user") setUserJoined(true);
      });

      socket.on("receiveMessage", (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
      });

      const msgs = await apiGetMessages(token, roomId);
      setMessages(msgs);
    };

    init();

    return () => socketRef.current?.disconnect();
  }, [userId]);

  const sendMessage = () => {
    if (!userJoined) {
      Alert.alert("Waiting", "User has not joined yet.");
      return;
    }

    if (!newMessage.trim()) return;

    socketRef.current?.emit("sendMessage", {
      chatRoomId,
      senderId: astrologerId,
      receiverId: userId,
      content: newMessage,
    });

    setNewMessage("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>
        {userJoined ? "User Connected" : "Waiting for user..."}
      </Text>

      <FlatList
        data={messages}
        keyExtractor={(i, idx) => i._id ?? idx.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.msg,
              item.senderId === astrologerId
                ? styles.mine
                : styles.theirs,
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
          editable={userJoined}
        />
        <TouchableOpacity onPress={sendMessage} disabled={!userJoined}>
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
