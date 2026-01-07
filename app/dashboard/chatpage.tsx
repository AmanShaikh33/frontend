import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { jwtDecode } from "jwt-decode";
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
import { socket } from "../../lib/socket";
import {
  apiCreateOrGetChatRoom,
  apiGetMessages,
  apiGetApprovedAstrologers,
  apiGetWalletBalance,
} from "../../api/api";

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
}

export default function UserChatPage() {
  const { astrologerId } = useLocalSearchParams<{ astrologerId: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoomId, setChatRoomId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [astroJoined, setAstroJoined] = useState(false);
  const [astrologerInfo, setAstrologerInfo] = useState<any>(null);
  const [userCoins, setUserCoins] = useState(0);
  const [billingActive, setBillingActive] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("userData");
      if (!token || !userStr || !astrologerId || !mounted) return;

      const decoded: any = jwtDecode(token);
      setUserId(decoded.id);

      const parsedUser = JSON.parse(userStr);

      // 1️⃣ Wallet balance
      try {
        const wallet = await apiGetWalletBalance(parsedUser._id);
        if (wallet?.success) setUserCoins(wallet.balance);
      } catch {}

      // 2️⃣ Create / get room
      const room = await apiCreateOrGetChatRoom(token, astrologerId);
      const roomId = room._id;
      setChatRoomId(roomId);

      // 3️⃣ Astrologer info
      const astrologers = await apiGetApprovedAstrologers();
      const astro = astrologers.find((a: any) => a._id === astrologerId);
      setAstrologerInfo(
        astro || { name: "Astrologer", pricePerMinute: 0 }
      );

      // 4️⃣ Join room & announce user (NO socket.connect)
      socket.emit("joinRoom", { roomId });
      socket.emit("userRequestsChat", {
        astrologerId,
        userId: decoded.id,
        roomId,
        userName: parsedUser.name,
      });
      socket.emit("participant-joined", {
        roomId,
        role: "user",
        userId: decoded.id,
        pricePerMinute: astro?.pricePerMinute || 0,
      });

      // 5️⃣ Listeners
      socket.on("participant-joined", ({ role }) => {
        if (role === "astrologer") setAstroJoined(true);
      });

      socket.on("receiveMessage", (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on("startBilling", () => {
        setBillingActive(true);
        setAstroJoined(true);
      });

      socket.on("coinsUpdated", (data) => {
        if (data?.userCoins !== undefined) setUserCoins(data.userCoins);
      });

      socket.on("timerUpdate", setElapsedTime);

      socket.on("endChatDueToLowBalance", () => {
        setBillingActive(false);
        setChatEnded(true);
        Alert.alert("Chat Ended", "Insufficient coins.");
      });

      socket.on("participantLeft", ({ role }) => {
        if (role === "astrologer") {
          setAstroJoined(false);
          setBillingActive(false);
          setChatEnded(true);
          Alert.alert("Chat Ended", "Astrologer left the chat.");
        }
      });

      // 6️⃣ Messages
      const msgs = await apiGetMessages(token, roomId);
      setMessages(msgs);
    };

    init();

    return () => {
      mounted = false;

      if (chatRoomId) {
        socket.emit("leaveRoom", { roomId: chatRoomId, role: "user" });
      }

      socket.off("participant-joined");
      socket.off("receiveMessage");
      socket.off("startBilling");
      socket.off("coinsUpdated");
      socket.off("timerUpdate");
      socket.off("endChatDueToLowBalance");
      socket.off("participantLeft");
    };
  }, [astrologerId]);

  const sendMessage = () => {
    if (chatEnded) return Alert.alert("Chat ended");
    if (!astroJoined) return Alert.alert("Waiting for astrologer");
    if (!newMessage.trim()) return;

    socket.emit("sendMessage", {
      chatRoomId,
      senderId: userId,
      receiverId: astrologerId,
      content: newMessage,
    });

    setNewMessage("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {astrologerInfo ? `Chat with ${astrologerInfo.name}` : "Loading..."}
        </Text>
        <Text style={styles.headerStatus}>
          {chatEnded
            ? "🔴 Chat Ended"
            : astroJoined
            ? "🟢 Connected"
            : "⏳ Waiting..."}
        </Text>

        {billingActive && (
          <Text style={styles.billing}>
            💰 Coins: {userCoins} | ⏱️{" "}
            {Math.floor(elapsedTime / 60)}:
            {(elapsedTime % 60).toString().padStart(2, "0")}
          </Text>
        )}
      </View>

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
          editable={!chatEnded && astroJoined}
        />
        <TouchableOpacity onPress={sendMessage}>
          <Text style={styles.send}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  headerStatus: { fontSize: 14, color: "#666" },
  billing: { fontSize: 12, color: "#e74c3c", marginTop: 4 },
  msg: { padding: 10, margin: 5, borderRadius: 10 },
  mine: { backgroundColor: "#DCF8C6", alignSelf: "flex-end" },
  theirs: { backgroundColor: "#EEE", alignSelf: "flex-start" },
  inputBar: { flexDirection: "row", padding: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10 },
  send: { marginLeft: 10, color: "blue", fontWeight: "bold" },
});
