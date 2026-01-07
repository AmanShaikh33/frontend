// app/astrologerdashboard/chatpage.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { socket } from "../../../lib/socket";
import {
  apiCreateOrGetChatRoom,
  apiGetMessages,
  apiGetUserById,
  apiGetMyProfile,
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
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userCoins, setUserCoins] = useState(0);
  const [billingActive, setBillingActive] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [astrologerEarnings, setAstrologerEarnings] = useState(0);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token || !userId || !mounted) return;

      const decoded: any = jwtDecode(token);
      setAstrologerId(decoded.id);

      // 1️⃣ Create or get room
      const room = await apiCreateOrGetChatRoom(token, null, userId);
      const roomId = room._id;
      setChatRoomId(roomId);

      // 2️⃣ Load user info
      const userDetails = await apiGetUserById(token, userId);
      setUserInfo(userDetails);
      setUserCoins(userDetails.coins || 0);

      // 3️⃣ Load astrologer earnings + doc ID
      const astroProfile = await apiGetMyProfile(token);
      setAstrologerEarnings(astroProfile.earnings || 0);
      const astrologerDocId = astroProfile._id;

      // 4️⃣ Join room + announce presence (NO socket.connect here)
      socket.emit("joinRoom", { roomId });
      socket.emit("participant-joined", {
        roomId,
        role: "astrologer",
        astrologerId: astrologerDocId,
      });

      // 5️⃣ Socket listeners (screen-scoped only)
      socket.on("participant-joined", ({ role }) => {
        if (role === "user") setUserJoined(true);
      });

      socket.on("receiveMessage", (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on("startBilling", () => {
        setBillingActive(true);
      });

      socket.on("coinsUpdated", (data) => {
        if (data?.userCoins !== undefined) setUserCoins(data.userCoins);
        if (data?.astrologerEarnings !== undefined)
          setAstrologerEarnings(data.astrologerEarnings);
      });

      socket.on("timerUpdate", setElapsedTime);

      socket.on("endChatDueToLowBalance", () => {
        setBillingActive(false);
        setChatEnded(true);
        Alert.alert("Chat Ended", "User has insufficient coins.");
      });

      socket.on("participantLeft", ({ role }) => {
        if (role === "user") {
          setChatEnded(true);
          setBillingActive(false);
          Alert.alert("Chat Ended", "User left the chat.");
        }
      });

      // 6️⃣ Load messages
      const msgs = await apiGetMessages(token, roomId);
      setMessages(msgs);
    };

    init();

    return () => {
      mounted = false;

      if (chatRoomId) {
        socket.emit("leaveRoom", { roomId: chatRoomId, role: "astrologer" });
      }

      socket.off("participant-joined");
      socket.off("receiveMessage");
      socket.off("startBilling");
      socket.off("coinsUpdated");
      socket.off("timerUpdate");
      socket.off("endChatDueToLowBalance");
      socket.off("participantLeft");
    };
  }, [userId]);

  const sendMessage = () => {
    if (chatEnded) return Alert.alert("Chat ended");
    if (!userJoined) return Alert.alert("Waiting for user");
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
    <View style={styles.container}>
      <Text style={styles.header}>
        {userInfo ? `Chat with ${userInfo.name}` : "Loading..."}
      </Text>

      {billingActive && (
        <Text style={styles.billing}>
          💰 Coins: {userCoins} | Earnings: ₹{astrologerEarnings} | ⏱️{" "}
          {Math.floor(elapsedTime / 60)}:
          {(elapsedTime % 60).toString().padStart(2, "0")}
        </Text>
      )}

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
          editable={!chatEnded && userJoined}
        />
        <TouchableOpacity onPress={sendMessage}>
          <Text style={styles.send}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { fontSize: 18, fontWeight: "bold", padding: 10 },
  billing: { fontSize: 12, paddingHorizontal: 10, color: "#e74c3c" },
  msg: { padding: 10, margin: 5, borderRadius: 10 },
  mine: { backgroundColor: "#DCF8C6", alignSelf: "flex-end" },
  theirs: { backgroundColor: "#EEE", alignSelf: "flex-start" },
  inputBar: { flexDirection: "row", padding: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10 },
  send: { marginLeft: 10, color: "blue", fontWeight: "bold" },
});
