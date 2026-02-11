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
  BackHandler,
} from "react-native";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
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
  const { userId, requestId } = useLocalSearchParams<{ userId: string; requestId?: string }>();
  const navigation = useNavigation();

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
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const [chatRequestPending, setChatRequestPending] = useState(false);
  const [chatAccepted, setChatAccepted] = useState(false);
  const [alertShown, setAlertShown] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      navigation.setOptions({
        tabBarStyle: undefined,
      });
    };
  }, [navigation]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token || !userId || !mounted) return;

      // Reset all state for new chat session
      setMessages([]);
      setSessionEarnings(0);
      setElapsedTime(0);
      setBillingActive(false);
      setChatEnded(false);
      setUserJoined(false);
      setChatRequestPending(false);
      setChatAccepted(true);

      const decoded: any = jwtDecode(token);
      setAstrologerId(decoded.id);

      // Use requestId as chatRoomId if available
      let roomId;
      if (requestId) {
        roomId = requestId;
        console.log("✅ Using requestId as sessionId:", roomId);
      } else {
        const room = await apiCreateOrGetChatRoom(token, null, userId);
        roomId = room._id;
        console.log("✅ Created/got room:", roomId);
      }
      
      setChatRoomId(roomId);

      // Load user info
      const userDetails = await apiGetUserById(token, userId);
      setUserInfo(userDetails);
      setUserCoins(userDetails.coins || 0);

      // Load astrologer profile
      const astroProfile = await apiGetMyProfile(token);
      const rate = astroProfile.pricePerMinute || 90;
      console.log("👨⚕️ Astrologer profile loaded:", astroProfile, "Rate:", rate);

      // Join the session
      socket.emit("joinSession", { sessionId: roomId });
      console.log("👥 Astrologer joined session:", roomId);

      // Remove old listeners
      socket.off("receiveMessage");
      socket.off("minute-billed");
      socket.off("timer-tick");
      socket.off("force-end-chat");
      socket.off("chatEnded");
      socket.off("session-created");

      // Listen for session creation (when astrologer accepts from another device/tab)
      socket.on("session-created", ({ sessionId }) => {
        console.log("✅ Session created event received, updating sessionId to:", sessionId);
        setChatRoomId(sessionId);
        socket.emit("joinSession", { sessionId });
      });

      // Socket listeners
      socket.on("receiveMessage", (msg: Message) => {
        console.log("📩 Message received:", msg);
        setMessages((prev) => [...prev, msg]);
      });

      socket.on("minute-billed", ({ minutes, coinsLeft, astrologerEarnings }) => {
        console.log("💰 [ASTROLOGER] Minute billed - Minutes:", minutes, "User coins:", coinsLeft, "Rate:", rate);
        setUserCoins(coinsLeft);
        const earnings = minutes * rate;
        console.log("💰 Calculated earnings:", earnings, "=", minutes, "×", rate);
        setSessionEarnings(earnings);
        setBillingActive(true);
      });

      socket.on("timer-tick", ({ elapsedSeconds }) => {
        console.log("⏱️ [ASTROLOGER] Timer tick:", elapsedSeconds);
        setElapsedTime(elapsedSeconds);
      });

      socket.on("force-end-chat", ({ reason }) => {
        console.log("🔚 Force end chat:", reason);
        setBillingActive(false);
        setChatEnded(true);
        if (!alertShown) {
          setAlertShown(true);
          Alert.alert("Chat Ended", reason === "INSUFFICIENT_COINS" ? "User has insufficient coins" : "Chat ended");
        }
      });

      socket.on("chatEnded", ({ endedBy, sessionEarnings: earnings }) => {
        console.log("🔚 Chat ended by:", endedBy, "Earnings:", earnings);
        setBillingActive(false);
        setChatEnded(true);
        if (!alertShown) {
          setAlertShown(true);
          Alert.alert("Chat Ended", `Session earnings: ${earnings || sessionEarnings} coins`);
        }
      });

      // Load messages
      try {
        const msgs = await apiGetMessages(token, roomId);
        setMessages(msgs);
      } catch (err) {
        console.log("⚠️ No messages yet or error loading:", err);
      }
    };

    init();

    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (chatRoomId && !chatEnded) {
        socket.emit('endChat', { roomId: chatRoomId, endedBy: 'astrologer' });
      }
      return false;
    });

    return () => {
      mounted = false;
      backHandler.remove();
      
      if (chatRoomId && !chatEnded) {
        socket.emit("endChat", { roomId: chatRoomId, endedBy: "astrologer" });
      }

      socket.off("receiveMessage");
      socket.off("minute-billed");
      socket.off("timer-tick");
      socket.off("force-end-chat");
      socket.off("chatEnded");
      socket.off("session-created");
    };
  }, [userId]);



  const sendMessage = () => {
    if (chatEnded) return Alert.alert("Chat ended");
    if (!newMessage.trim()) return;

    console.log("📤 Sending message:", { chatRoomId, content: newMessage });

    socket.emit("sendMessage", {
      sessionId: chatRoomId,
      senderId: astrologerId,
      receiverId: userId,
      content: newMessage,
    });

    setNewMessage("");
  };

  const endChat = () => {
    if (chatEnded) return;
    
    socket.emit('endChat', { 
      roomId: chatRoomId, 
      endedBy: 'astrologer'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {userInfo ? `Chat with ${userInfo.name}` : "Loading..."}
      </Text>



      {(billingActive || chatAccepted) && (
        <View style={styles.billingContainer}>
          <Text style={styles.billing}>
            💰 User: {userCoins} | Earnings: {sessionEarnings} | ⏱️ {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </Text>
          <TouchableOpacity onPress={endChat} style={styles.endButton}>
            <Text style={styles.endButtonText}>End Chat</Text>
          </TouchableOpacity>
        </View>
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
          editable={!chatEnded && chatAccepted}
          placeholder={chatAccepted ? "Type a message..." : "Accept chat to start messaging..."}
        />
        <TouchableOpacity onPress={sendMessage}>
          <Text style={styles.send}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingBottom: 20 },
  header: { fontSize: 18, fontWeight: "bold", padding: 10 },

  billingContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, marginBottom: 5 },
  billing: { fontSize: 12, color: "#e74c3c", flex: 1 },
  endButton: { backgroundColor: '#e74c3c', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  endButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  msg: { padding: 10, margin: 5, borderRadius: 10 },
  mine: { backgroundColor: "#DCF8C6", alignSelf: "flex-end" },
  theirs: { backgroundColor: "#EEE", alignSelf: "flex-start" },
  inputBar: { flexDirection: "row", padding: 10, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#ddd' },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10 },
  send: { marginLeft: 10, color: "blue", fontWeight: "bold" },
});
