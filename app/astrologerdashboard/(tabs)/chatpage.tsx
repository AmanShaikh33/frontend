// app/astrologerdashboard/chatpage.tsx

import React, { useEffect, useState } from "react";
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
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwtDecode from "jwt-decode";
import { socket } from "../../../lib/socket";
import {
  apiCreateOrGetChatRoom,
  apiGetMessages,
} from "../../../api/api";

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
}

export default function AstrologerChatPage() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoomId, setChatRoomId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [astrologerId, setAstrologerId] = useState("");
  const [userJoined, setUserJoined] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token || !userId) return;

      const decoded: any = jwtDecode(token);
      setAstrologerId(decoded.id);

      const room = await apiCreateOrGetChatRoom(token, null, userId);
      const roomId = room._id;
      setChatRoomId(roomId);

      // ✅ Ensure socket is connected
      if (!socket.connected) {
        socket.connect();
      }

      // ✅ Join same room as user
      socket.emit("joinRoom", { roomId });

      socket.emit("participant-joined", {
        roomId,
        role: "astrologer",
        astrologerId: decoded.id,
      });

      socket.on("participant-joined", ({ role }) => {
        if (role === "user") {
          setUserJoined(true);
        }
      });

      socket.on("receiveMessage", (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
      });

      const msgs = await apiGetMessages(token, roomId);
      setMessages(msgs);
    };

    init();

    return () => {
      socket.off("participant-joined");
      socket.off("receiveMessage");
    };
  }, [userId]);

  const sendMessage = () => {
    if (!userJoined) {
      Alert.alert("Waiting", "User has not joined yet.");
      return;
    }

    if (!newMessage.trim()) return;

    socket.emit("sendMessage", {
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
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  header: {
    padding: 15,
    fontWeight: "bold",
    fontSize: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  msg: {
    padding: 12,
    margin: 8,
    borderRadius: 15,
    maxWidth: "80%",
  },
  mine: { backgroundColor: "#DCF8C6", alignSelf: "flex-end" },
  theirs: { backgroundColor: "#EEE", alignSelf: "flex-start" },
  inputBar: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  send: {
    marginLeft: 15,
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
