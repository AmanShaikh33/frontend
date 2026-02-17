

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
  Modal,
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
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [chatSummary, setChatSummary] = useState<any>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

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
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token || !userId || !mounted) return;

        const decoded: any = jwtDecode(token);
        setAstrologerId(decoded.id);

        console.log("📱 Astrologer chat page loaded for user:", userId);
        console.log("🔮 Astrologer ID:", decoded.id);
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
        }

        socket.emit("astrologerOnline", { astrologerId: decoded.id });
        console.log("🟢 Astrologer registered online:", decoded.id);

    
        const userDetails = await apiGetUserById(token, userId);
        setUserInfo(userDetails);
        setUserCoins(userDetails.coins || 0);
        console.log("✅ User info loaded:", userDetails.name, "Coins:", userDetails.coins);

       
        const astroProfile = await apiGetMyProfile(token);
        const rate = astroProfile.pricePerMinute || 90;
        console.log("👨⚕️ Astrologer profile loaded:", astroProfile.name, "Rate:", rate);

        socket.removeAllListeners("receiveMessage");
        socket.removeAllListeners("minute-billed");
        socket.removeAllListeners("timer-tick");
        socket.removeAllListeners("force-end-chat");
        socket.removeAllListeners("chatEnded");
        socket.removeAllListeners("session-created");
        socket.removeAllListeners("chat-accepted");


        socket.on("chat-accepted", async ({ sessionId }) => {
          if (!mounted) return;
          console.log("✅ chat-accepted received! SessionId:", sessionId);
          setChatRoomId(sessionId);
          setChatAccepted(true);
          setBillingActive(true);
          setElapsedTime(0); 
          setSessionEarnings(0); // Reset earnings for new session
          socket.emit("joinSession", { sessionId });
          console.log("✅ chatRoomId set to:", sessionId);
          try {
            const msgs = await apiGetMessages(token, sessionId);
            setMessages(msgs);
          } catch (err) {
            console.log("⚠️ No messages yet:", err);
          }
        });

        // Socket listeners
        socket.on("receiveMessage", (msg: Message) => {
          if (!mounted) return;
          console.log("📩 Message received:", msg);
          setMessages((prev) => [...prev, msg]);
        });

        socket.on("minute-billed", ({ minutes, coinsLeft, astrologerEarnings }) => {
          if (!mounted) return;
          console.log("[ASTROLOGER] Minute billed - Minutes:", minutes, "User coins:", coinsLeft);
          setUserCoins(coinsLeft);
          const earnings = minutes * rate;
          console.log("Calculated earnings:", earnings, "=", minutes, "×", rate);
          setSessionEarnings(earnings);
          setBillingActive(true);
        });

        socket.on("timer-tick", ({ elapsedSeconds }) => {
          if (!mounted) return;
          setElapsedTime(elapsedSeconds);
        });

        const timer = setInterval(() => {
          setElapsedTime(prev => prev + 1);
        }, 1000);
        setTimerInterval(timer);

        socket.on("force-end-chat", ({ reason }) => {
          if (!mounted) return;
          console.log("🔚 Force end chat:", reason);
          if (timerInterval) clearInterval(timerInterval);
          setBillingActive(false);
          setChatEnded(true);
          setAlertShown(true);
          Alert.alert("Chat Ended", reason === "INSUFFICIENT_COINS" ? "User has insufficient coins" : "Chat ended");
        });

        socket.on("chatEnded", ({ endedBy, sessionEarnings: earnings, totalCoins }) => {
          if (!mounted) return;
          console.log("🔚 Chat ended by:", endedBy, "Earnings:", earnings);
          if (timerInterval) clearInterval(timerInterval);
          setBillingActive(false);
          setChatEnded(true);
          setAlertShown(true);
          setElapsedTime((currentTime) => {
            const minutes = Math.floor(currentTime / 60);
            setChatSummary({
              minutes,
              earnings: earnings || sessionEarnings,
            });
            setShowSummaryModal(true);
            return currentTime;
          });
        });

        
        if (requestId) {
          console.log("📤 Auto-accepting chat with requestId:", requestId);
          
          
          socket.once("session-created", ({ sessionId }) => {
            if (!mounted) return;
            console.log("✅ Session created after acceptance, sessionId:", sessionId);
            setChatRoomId(sessionId);
            setElapsedTime(0); 
            setSessionEarnings(0); // Reset earnings for new session
            socket.emit("joinSession", { sessionId });
            console.log("✅ chatRoomId set to:", sessionId);
          });
          
          socket.emit("astrologerAcceptsChat", {
            requestId,
            userId,
          });
          console.log("✅ Chat acceptance emitted");
          
          setChatAccepted(true);
          setBillingActive(true);
        } else {
          
          try {
            const room = await apiCreateOrGetChatRoom(token, userId);
            console.log("✅ Chat room created/retrieved:", room._id);
            setChatRoomId(room._id);
            setChatAccepted(true);
            setBillingActive(true);
            setElapsedTime(0); // Reset timer for new session
            setSessionEarnings(0); // Reset earnings for new session
            socket.emit("joinSession", { sessionId: room._id });
            const msgs = await apiGetMessages(token, room._id);
            setMessages(msgs);
            console.log("✅ chatRoomId set to:", room._id);
          } catch (err) {
            console.log("⚠️ Could not create/get chat room:", err);
          }
        }
      } catch (error) {
        console.error("❌ Error in init:", error);
      }
    };

    init();

   
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (chatRoomId && !chatEnded) {
        socket.emit('endChat', { roomId: chatRoomId, endedBy: 'astrologer' });
      }
      return false;
    });

    return () => {
      mounted = false;
      backHandler.remove();
      
    
      if (timerInterval) clearInterval(timerInterval);
      
  
      socket.removeAllListeners("receiveMessage");
      socket.removeAllListeners("minute-billed");
      socket.removeAllListeners("timer-tick");
      socket.removeAllListeners("force-end-chat");
      socket.removeAllListeners("chatEnded");
      socket.removeAllListeners("session-created");
      socket.removeAllListeners("chat-accepted");
    };
  }, [userId, requestId]);



  const sendMessage = () => {
    if (chatEnded) return Alert.alert("Chat ended");
    if (!newMessage.trim()) return;
    if (!chatRoomId) {
      console.error("❌ Cannot send message: chatRoomId is empty");
      Alert.alert("Error", "Chat session not ready. Please wait...");
      return;
    }

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
    if (!chatRoomId) {
      console.error("❌ Cannot end chat: chatRoomId is empty");
      Alert.alert("Error", "Chat session not ready yet.");
      return;
    }
    
    Alert.alert(
      "End Chat",
      "Are you sure you want to end the chat?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            console.log("🔚 Ending chat with roomId:", chatRoomId);
            socket.emit('endChat', { 
              roomId: chatRoomId, 
              endedBy: 'astrologer'
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {userInfo ? `Chat with ${userInfo.name}` : "Loading..."}
      </Text>

      {!chatRoomId && (
        <View style={{ padding: 10, backgroundColor: '#fff3cd', margin: 10, borderRadius: 5 }}>
          <Text style={{ color: '#856404', textAlign: 'center' }}>⏳ Waiting for chat session to start...</Text>
        </View>
      )}



      {(billingActive || chatAccepted) && chatRoomId && (
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

      
      <Modal
        visible={showSummaryModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModal}>
            <Text style={styles.summaryTitle}>✅ Chat Ended</Text>
            <Text style={styles.summaryText}>Talk Duration: {chatSummary?.minutes || 0} minutes</Text>
            <Text style={styles.summaryEarnings}>💰 Coins Earned: {chatSummary?.earnings || 0}</Text>
            <TouchableOpacity
              style={styles.okButton}
              onPress={() => {
                setShowSummaryModal(false);
                router.replace('/astrologerdashboard/(tabs)/home');
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  summaryModal: { backgroundColor: 'white', borderRadius: 16, padding: 24, width: '85%', alignItems: 'center' },
  summaryTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#2d1e3f' },
  summaryText: { fontSize: 16, marginBottom: 8, color: '#555' },
  summaryEarnings: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#27ae60' },
  okButton: { backgroundColor: '#e0c878', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  okButtonText: { color: '#2d1e3f', fontWeight: 'bold', fontSize: 16 },
});
