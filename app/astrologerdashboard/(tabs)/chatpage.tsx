import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
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

interface Message {
  _id?: string;
  chatRoomId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: string;
}

const AstrologerChatPage = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoomId, setChatRoomId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [astrologerId, setAstrologerId] = useState("");
  const [userJoined, setUserJoined] = useState(false);
  const [timer, setTimer] = useState(60);
  const [pricePerMinute, setPricePerMinute] = useState(0);
  const [userCoins, setUserCoins] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (!userJoined) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev === 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [userJoined]);

  /* ---------------- SETUP CHAT ---------------- */
  useEffect(() => {
    const setupChat = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token || !userId) return;

        const decoded: any = jwtDecode(token);
        setAstrologerId(decoded.id);

        const socket = io("https://astrologyapp-1.onrender.com", {
          transports: ["websocket"],
        });
        socketRef.current = socket;

        const chatRoom = await apiCreateOrGetChatRoom(token, null, userId);
        const roomId = chatRoom.chatRoomId || chatRoom._id;

        setChatRoomId(roomId);
        setPricePerMinute(chatRoom.pricePerMinute);
        setUserCoins(chatRoom.userCoins ?? 0);

        socket.emit("joinRoom", { roomId });
        socket.emit("astro-joined", {
          roomId,
          astrologerId: decoded.id,
        });

        const msgs = await apiGetMessages(token, roomId);
        setMessages(msgs);

        /* ---- SOCKET EVENTS ---- */
        socket.on("userJoinedRoom", () => setUserJoined(true));

        socket.on("receiveMessage", (msg: Message) => {
          setMessages((prev) =>
            prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
          );
        });

        socket.on("coinsUpdated", setUserCoins);

        socket.on("endChatDueToLowBalance", () => {
          Alert.alert(
            "Chat Ended",
            "User balance finished.",
            [{ text: "OK", onPress: () => router.back() }]
          );
        });
      } catch (err: any) {
        console.log("Chat error:", err.message);
      }
    };

    setupChat();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId]);

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSend = () => {
    if (!userJoined) {
      Alert.alert("Please wait", "User has not joined yet.");
      return;
    }

    if (!newMessage.trim()) return;

    socketRef.current?.emit("sendMessage", {
      chatRoomId,
      senderId: astrologerId,
      receiverId: userId,
      content: newMessage.trim(),
    });

    setNewMessage("");
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.coins}>User Coins: {userCoins}</Text>

        {userJoined ? (
          <>
            <Text>Price/Min: ₹{pricePerMinute}</Text>
            <Text style={styles.timer}>Next charge in: {timer}s</Text>
          </>
        ) : (
          <Text style={styles.waiting}>⏳ Waiting for user to join…</Text>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, i) => item._id ?? i.toString()}
            renderItem={({ item }) => {
              const isMine = item.senderId === astrologerId;
              return (
                <View
                  style={[
                    styles.bubble,
                    isMine ? styles.sent : styles.received,
                  ]}
                >
                  <Text>{item.content}</Text>
                </View>
              );
            }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />

          {/* INPUT */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder={
                userJoined ? "Type a message..." : "Waiting for user..."
              }
              editable={userJoined}
              value={newMessage}
              onChangeText={setNewMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !userJoined && styles.sendDisabled,
              ]}
              onPress={handleSend}
              disabled={!userJoined}
            >
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AstrologerChatPage;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f8f8" },
  header: {
    padding: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  coins: { fontSize: 18, fontWeight: "bold" },
  timer: { color: "green" },
  waiting: { color: "orange" },

  chatContainer: { flex: 1, padding: 10 },

  bubble: {
    maxWidth: "75%",
    padding: 10,
    marginVertical: 5,
    borderRadius: 12,
  },
  sent: { alignSelf: "flex-end", backgroundColor: "#DCF8C6" },
  received: { alignSelf: "flex-start", backgroundColor: "#ECECEC" },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    padding: 10,
    backgroundColor: "white",
    marginBottom: 10,
  },
  input: { flex: 1, fontSize: 16 },
  sendBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
  sendDisabled: { backgroundColor: "#aaa" },
  sendText: { color: "white", fontWeight: "bold" },
});
