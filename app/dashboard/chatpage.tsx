import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  BackHandler,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { socket } from "../../lib/socket";
import {
  apiGetAstrologerById,
  apiGetMe,
  apiGetMessages,
  apiEndChat,
} from "../../api/api";

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
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [astrologerInfo, setAstrologerInfo] = useState<any>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [waitingForAcceptance, setWaitingForAcceptance] = useState(true);
  const [chatEnded, setChatEnded] = useState(false);

  const [userCoins, setUserCoins] = useState(0);
  const [sessionCost, setSessionCost] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [chatSummary, setChatSummary] = useState<any>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const hasEmittedRequest = useRef(false);

  /* ===============================
     🔌 SOCKET + INIT (SAFE)
  =============================== */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token || !astrologerId || !mounted) return;

        const decoded: any = jwtDecode(token);
        setUserId(decoded.id);

        console.log("📱 User chat page loaded for astrologer:", astrologerId);
        console.log("👤 User ID:", decoded.id, "Name:", decoded.name);
        console.log("🔌 Socket connected:", socket.connected);

        if (!socket.connected) {
          console.log("🔌 Socket not connected, connecting now...");
          socket.connect();
          await new Promise((resolve) => {
            if (socket.connected) {
              resolve(true);
            } else {
              socket.once("connect", () => resolve(true));
            }
          });
          console.log("✅ Socket connected successfully");
        } else {
          console.log("✅ Socket already connected");
        }

        // Register user online
        socket.emit("userOnline", { userId: decoded.id });
        console.log("🟢 User registered online:", decoded.id);

        // Load astrologer info
        console.log("🔍 Loading astrologer info...");
        const astro = await apiGetAstrologerById(token, astrologerId);
        setAstrologerInfo(astro);
        console.log("✅ Astrologer info loaded:", astro.name);

        // Load user coins
        console.log("🔍 Loading user profile...");
        const profile = await apiGetMe(token);
        setUserCoins(profile.coins || 0);
        console.log("✅ User profile loaded, coins:", profile.coins);

        /* 🔥 REMOVE OLD LISTENERS FIRST */
        socket.removeAllListeners("chat-accepted");
        socket.removeAllListeners("chatAccepted");
        socket.removeAllListeners("minute-billed");
        socket.removeAllListeners("timer-tick");
        socket.removeAllListeners("force-end-chat");
        socket.removeAllListeners("chatEnded");
        socket.removeAllListeners("receiveMessage");
        socket.removeAllListeners("insufficient-coins");

        /* ❌ INSUFFICIENT COINS */
        socket.on("insufficient-coins", ({ message, required, current }) => {
          console.log("❌ Insufficient coins:", message);
          setWaitingForAcceptance(false);
          Alert.alert(
            "Insufficient Coins",
            `You need ${required} coins to chat. You have ${current} coins. Please add coins to your wallet.`,
            [{ text: "OK" }]
          );
        });

        /* ✅ CHAT ACCEPTED */
        socket.once("chat-accepted", async ({ sessionId }) => {
          if (!mounted) return;
          console.log("✅ chat-accepted received! SessionId:", sessionId);
          setSessionId(sessionId);
          setWaitingForAcceptance(false);
          socket.emit("joinSession", { sessionId });
          const msgs = await apiGetMessages(token, sessionId);
          setMessages(msgs);
          
          // Start client-side timer
          const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
          }, 1000);
          setTimerInterval(timer);
        });

        socket.once("chatAccepted", async (data) => {
          if (!mounted) return;
          console.log("✅ chatAccepted received! Data:", data);
          const sid = data.sessionId || data.session || data;
          setSessionId(sid);
          setWaitingForAcceptance(false);
          socket.emit("joinSession", { sessionId: sid });
          const msgs = await apiGetMessages(token, sid);
          setMessages(msgs);
        });

        /* 💰 BILLING */
        socket.on("minute-billed", ({ minutes, coinsLeft }) => {
          if (!mounted) return;
          console.log("💰 Minute billed - Minutes:", minutes, "Coins left:", coinsLeft);
          setUserCoins(coinsLeft);
          setSessionCost(minutes * (astro.pricePerMinute || 0));
        });

        /* ⏱️ TIMER */
        socket.on("timer-tick", ({ elapsedSeconds }) => {
          if (!mounted) return;
          setElapsedTime(elapsedSeconds);
        });

        /* 🔚 FORCE END CHAT */
        socket.on("force-end-chat", ({ reason }) => {
          if (!mounted) return;
          console.log("🔚 Force end chat:", reason);
          if (timerInterval) clearInterval(timerInterval);
          setChatEnded(true);
          Alert.alert("Chat Ended", reason === "INSUFFICIENT_COINS" ? "Insufficient coins to continue" : "Chat ended");
        });

        /* 🔚 CHAT ENDED */
        socket.on("chatEnded", ({ totalCoins }) => {
          if (!mounted) return;
          console.log("🔚 Chat ended - Total coins:", totalCoins);
          if (timerInterval) clearInterval(timerInterval);
          setChatEnded(true);
          setElapsedTime((currentTime) => {
            const minutes = Math.floor(currentTime / 60);
            setChatSummary({
              minutes,
              coinsDeducted: totalCoins || sessionCost,
            });
            setShowSummaryModal(true);
            return currentTime;
          });
        });

        /* 📩 RECEIVE MESSAGE */
        socket.on("receiveMessage", (msg: Message) => {
          if (!mounted) return;
          setMessages((prev) => [...prev, msg]);
        });

        /* 📤 EMIT CHAT REQUEST (ONCE) */
        if (!hasEmittedRequest.current) {
          console.log("📤 About to emit userRequestsChat...");
          console.log("📤 Data:", { astrologerId, userId: decoded.id, userName: decoded.name || "User" });

          socket.emit("userRequestsChat", {
            astrologerId,
            userId: decoded.id,
            userName: decoded.name || "User",
          });

          hasEmittedRequest.current = true;
          console.log("✅ Chat request emitted successfully");
        }
      } catch (error) {
        console.error("❌ Error in init:", error);
      }
    };

    init();

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (sessionId && !chatEnded) {
          endChat();
        }
        return false;
      }
    );

    return () => {
      mounted = false;
      backHandler.remove();
      
      if (timerInterval) clearInterval(timerInterval);

      socket.removeAllListeners("chat-accepted");
      socket.removeAllListeners("chatAccepted");
      socket.removeAllListeners("minute-billed");
      socket.removeAllListeners("timer-tick");
      socket.removeAllListeners("force-end-chat");
      socket.removeAllListeners("chatEnded");
      socket.removeAllListeners("receiveMessage");
      socket.removeAllListeners("insufficient-coins");
    };
  }, [astrologerId]);

  /* ===============================
     ✉️ SEND MESSAGE
  =============================== */
  const sendMessage = () => {
    if (!sessionId || chatEnded || !newMessage.trim()) return;

    socket.emit("sendMessage", {
      sessionId,
      senderId: userId,
      receiverId: astrologerId,
      content: newMessage,
    });

    setNewMessage("");
  };

  /* ===============================
     🔚 END CHAT
  =============================== */
  const endChat = async () => {
    if (!sessionId || chatEnded) return;

    Alert.alert(
      "End Chat",
      "Are you sure you want to end the chat?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            socket.emit("endChat", {
              roomId: sessionId,
              endedBy: "user",
            });
            setChatEnded(true);
          }
        }
      ]
    );
  };

  /* ===============================
     🖼️ UI
  =============================== */
  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {astrologerInfo ? `Chat with ${astrologerInfo.name}` : "Loading..."}
      </Text>

      {waitingForAcceptance && (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>
            ⏳ Waiting for astrologer to accept...
          </Text>
        </View>
      )}

      {sessionId && !chatEnded && (
        <View style={styles.billingContainer}>
          <Text style={styles.billing}>
            💰 Coins: {userCoins} | Cost: {sessionCost} | ⏱️ {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
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
          editable={!!sessionId && !chatEnded}
          placeholder={
            sessionId ? "Type a message..." : "Waiting for acceptance..."
          }
        />
        <TouchableOpacity onPress={sendMessage}>
          <Text style={styles.send}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Summary Modal */}
      <Modal
        visible={showSummaryModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModal}>
            <Text style={styles.summaryTitle}>✅ Chat Ended</Text>
            <Text style={styles.summaryText}>Talk Duration: {chatSummary?.minutes || 0} minutes</Text>
            <Text style={styles.summaryDeducted}>💰 Coins Deducted: {chatSummary?.coinsDeducted || 0}</Text>
            <TouchableOpacity
              style={styles.okButton}
              onPress={() => {
                setShowSummaryModal(false);
                router.replace('/dashboard/(tabs)/home');
              }}
            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ===============================
   🎨 STYLES
=============================== */
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingBottom: 80 },
  header: { fontSize: 18, fontWeight: "bold", padding: 10 },
  waitingContainer: { padding: 20, alignItems: "center" },
  waitingText: { fontSize: 16, color: "#f39c12", fontStyle: "italic" },
  billingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  billing: { fontSize: 12, color: "#27ae60" },
  endButton: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  endButtonText: { color: "white", fontSize: 12, fontWeight: "bold" },
  msg: { padding: 10, margin: 5, borderRadius: 10 },
  mine: { backgroundColor: "#DCF8C6", alignSelf: "flex-end" },
  theirs: { backgroundColor: "#EEE", alignSelf: "flex-start" },
  inputBar: { flexDirection: "row", padding: 10, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white' },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10 },
  send: { marginLeft: 10, color: "blue", fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  summaryModal: { backgroundColor: 'white', borderRadius: 16, padding: 24, width: '85%', alignItems: 'center' },
  summaryTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#2d1e3f' },
  summaryText: { fontSize: 16, marginBottom: 8, color: '#555' },
  summaryDeducted: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#e74c3c' },
  okButton: { backgroundColor: '#e0c878', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  okButtonText: { color: '#2d1e3f', fontWeight: 'bold', fontSize: 16 },
});
