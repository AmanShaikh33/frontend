import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import jwtDecode from "jwt-decode";
import React, { useEffect, useState, useRef } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  Alert,
  StyleSheet,
} from "react-native";
import { io, Socket } from "socket.io-client";
import { apiCreateOrGetChatRoom, apiGetMessages } from "../../api/api";

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { astrologerId } = useLocalSearchParams<{ astrologerId: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoomId, setChatRoomId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [pricePerMinute, setPricePerMinute] = useState(0);
  const [userCoins, setUserCoins] = useState(0);
  const [astroJoined, setAstroJoined] = useState(false);
  const [timer, setTimer] = useState(60);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // ---------------- TIMER ----------------
  useEffect(() => {
    if (!astroJoined) return;

    const interval = setInterval(() => {
      setTimer((prev) => (prev === 1 ? 60 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [astroJoined]);

  // ---------------- SETUP CHAT ----------------
  useEffect(() => {
    const setupChat = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userStr = await AsyncStorage.getItem("userData");

        if (!token || !astrologerId || !userStr) return;

        const decoded: any = jwtDecode(token);
        setUserId(decoded.id);

        const parsedUser = JSON.parse(userStr);

        const roomRes = await apiCreateOrGetChatRoom(token, astrologerId);
        const roomId = roomRes.chatRoomId || roomRes._id;

        setChatRoomId(roomId);
        setPricePerMinute(roomRes.pricePerMinute || 0);
        setUserCoins(roomRes.userCoins || parsedUser.coins || 0);

        const socket = io("https://astrologyapp-1.onrender.com", {
          transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.emit("joinRoom", { roomId });

        socket.emit("user-joined", {
          roomId,
          userId: decoded.id,
          pricePerMinute: roomRes.pricePerMinute,
        });

        socket.emit("requestChat", {
          astrologerId,
          userId: decoded.id,
          roomId,
          userName: parsedUser.name,
        });

        const msgs = await apiGetMessages(token, roomId);
        setMessages(msgs);

        socket.on("astroJoinedRoom", () => setAstroJoined(true));

        socket.on("receiveMessage", (msg: Message) => {
          setMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        });

        socket.on("coinsUpdated", setUserCoins);

        socket.on("endChatDueToLowBalance", () => {
          Alert.alert("Balance Low", "Chat ended due to low balance.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        });
      } catch (err: any) {
        console.log("Chat setup error:", err.message);
      }
    };

    setupChat();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [astrologerId]);

  // ---------------- SEND MESSAGE ----------------
  const handleSend = () => {
    if (!astroJoined) {
      Alert.alert("Please wait", "Astrologer has not joined yet.");
      return;
    }

    if (!newMessage.trim()) return;

    socketRef.current?.emit("sendMessage", {
      chatRoomId,
      senderId: userId,
      receiverId: astrologerId,
      content: newMessage.trim(),
    });

    setNewMessage("");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Coins: {userCoins}</Text>

        {astroJoined ? (
          <>
            <Text style={styles.subText}>Price/Min: ₹{pricePerMinute}</Text>
            <Text style={styles.timer}>Next charge in: {timer}s</Text>
          </>
        ) : (
          <Text style={styles.waitText}>⏳ Waiting for astrologer…</Text>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, i) => item._id ?? i.toString()}
          contentContainerStyle={{ paddingBottom: 80, paddingTop: 10 }}
          renderItem={({ item }) => {
            const mine = String(item.senderId) === String(userId);

            return (
              <View
                style={[
                  styles.messageBubble,
                  mine ? styles.mine : styles.theirs,
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
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder={astroJoined ? "Type a message…" : "Waiting…"}
            editable={astroJoined}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!astroJoined}
            style={[
              styles.sendBtn,
              { backgroundColor: astroJoined ? "#007AFF" : "#aaa" },
            ]}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },

  header: {
    padding: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  headerText: { fontSize: 18, fontWeight: "bold" },
  subText: { marginTop: 4, color: "#555" },
  timer: { marginTop: 4, color: "green" },
  waitText: { marginTop: 6, color: "orange" },

  messageBubble: {
    maxWidth: "75%",
    padding: 10,
    marginVertical: 4,
    borderRadius: 14,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: "#ECECEC",
  },

  inputBar: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 25,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  input: { flex: 1, paddingHorizontal: 10, fontSize: 16 },
  sendBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendText: { color: "white", fontWeight: "bold" },
});
