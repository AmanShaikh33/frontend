import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  BackHandler,
  Modal,
  Image,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { Ionicons } from "@expo/vector-icons";
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
  const { userId, requestId } =
    useLocalSearchParams<{ userId: string; requestId?: string }>();

  const navigation = useNavigation();
  const rateRef = React.useRef<number>(90);

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoomId, setChatRoomId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [astrologerId, setAstrologerId] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [chatEnded, setChatEnded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const [chatAccepted, setChatAccepted] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [chatSummary, setChatSummary] = useState<any>(null);

  useEffect(() => {
    navigation.setOptions({ tabBarStyle: { display: "none" } });
    return () => navigation.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token || !userId || !mounted) return;

      const decoded: any = jwtDecode(token);
      setAstrologerId(decoded.id);

      if (!socket.connected) {
        socket.connect();
        await new Promise<void>((resolve) => {
          socket.once("connect", () => resolve());
        });
      }

      socket.emit("astrologerOnline", { astrologerId: decoded.id });

      const userDetails = await apiGetUserById(token, userId);
      setUserInfo(userDetails);

      const astroProfile = await apiGetMyProfile(token);
      const rate = astroProfile.pricePerMinute || 90;
      rateRef.current = rate;

      socket.off("receiveMessage");
      socket.off("minute-billed");
      socket.off("timer-tick");
      socket.off("force-end-chat");
      socket.off("chatEnded");
      socket.off("session-created");
      socket.off("chat-accepted");

      const handleSessionStart = async (sessionId: string) => {
        if (!mounted) return;

        setChatRoomId(sessionId);
        setChatAccepted(true);
        setChatEnded(false);
        setElapsedTime(0);
        setSessionEarnings(0);
        setMessages([]);

        socket.emit("joinSession", { sessionId });

        const msgs = await apiGetMessages(token, sessionId);
        setMessages(msgs);
      };

      socket.on("chat-accepted", ({ sessionId }) => {
        handleSessionStart(sessionId);
      });

      socket.once("session-created", ({ sessionId }) => {
        handleSessionStart(sessionId);
      });

      socket.on("receiveMessage", (msg: Message) => {
        if (!mounted) return;
        setMessages((prev) => [...prev, msg]);
      });

      socket.on("timer-tick", ({ elapsedSeconds }) => {
        if (!mounted) return;
        setElapsedTime(elapsedSeconds);
      });

      // Earnings only ever change here -- once per real, confirmed
      // 60-second billing tick from the server. No per-second estimate.
      socket.on("minute-billed", ({ minutes }) => {
        if (!mounted) return;
        setSessionEarnings(minutes * rate);
      });

      socket.on("force-end-chat", () => {
        if (!mounted) return;
        setChatEnded(true);
        Alert.alert("Chat Ended");
      });

      socket.on("chatEnded", ({ sessionEarnings: earnings, totalMinutes }) => {
        if (!mounted) return;
        setChatEnded(true);
        setChatSummary({
          minutes: totalMinutes ?? 0,
          earnings: earnings || sessionEarnings,
        });
        setShowSummaryModal(true);
      });

      if (requestId) {
        socket.emit("astrologerAcceptsChat", { requestId, userId });
      } else {
        const room = await apiCreateOrGetChatRoom(token, userId);
        handleSessionStart(room._id);
      }
    };

    init();

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (chatRoomId && !chatEnded) {
          socket.emit("endChat", { roomId: chatRoomId, endedBy: "astrologer" });
        }
        return false;
      }
    );

    return () => {
      mounted = false;
      backHandler.remove();

      socket.off("receiveMessage");
      socket.off("minute-billed");
      socket.off("timer-tick");
      socket.off("force-end-chat");
      socket.off("chatEnded");
      socket.off("session-created");
      socket.off("chat-accepted");
    };
  }, [userId, requestId]);

  const sendMessage = () => {
    if (!chatRoomId || chatEnded || !newMessage.trim()) return;

    socket.emit("sendMessage", {
      sessionId: chatRoomId,
      senderId: astrologerId,
      receiverId: userId,
      content: newMessage,
    });

    setNewMessage("");
  };

  const endChat = () => {
    if (!chatRoomId || chatEnded) return;

    Alert.alert("End Chat", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: () => {
          socket.emit("endChat", { roomId: chatRoomId, endedBy: "astrologer" });
        },
      },
    ]);
  };

  const formatClock = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {userInfo?.profilePic ? (
          <Image source={{ uri: userInfo.profilePic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person" size={20} color="#4b2e83" />
          </View>
        )}

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.name} numberOfLines={1}>
            {userInfo ? userInfo.name : "Loading..."}
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>

        <View style={styles.rateBadge}>
          <Ionicons name="cash-outline" size={14} color="#fff" />
          <Text style={styles.rateBadgeText}>{rateRef.current}/min</Text>
        </View>
      </View>

      {/* Live session bar */}
      {chatAccepted && chatRoomId && !chatEnded && (
        <View style={styles.liveBar}>
          <View style={styles.liveLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live Session</Text>
            <Text style={styles.liveDivider}>|</Text>
            <Text style={styles.liveClock}>{formatClock(elapsedTime)}</Text>
          </View>

          <TouchableOpacity onPress={endChat} style={styles.endButton}>
            <Text style={styles.endButtonText}>End</Text>
          </TouchableOpacity>
        </View>
      )}

      {chatAccepted && chatRoomId && !chatEnded && (
        <View style={styles.billingRow}>
          <Text style={styles.billingText}>
            💰 Earnings: {sessionEarnings}
          </Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(i, idx) => i._id ?? idx.toString()}
        style={styles.messageList}
        contentContainerStyle={{ paddingVertical: 12 }}
        renderItem={({ item }) => {
          const isMine = item.senderId === astrologerId;
          return (
            <View
              style={[
                styles.msgRow,
                isMine ? styles.msgRowMine : styles.msgRowTheirs,
              ]}
            >
              {!isMine &&
                (userInfo?.profilePic ? (
                  <Image
                    source={{ uri: userInfo.profilePic }}
                    style={styles.msgAvatar}
                  />
                ) : (
                  <View style={styles.msgAvatarFallback}>
                    <Ionicons name="person" size={14} color="#4b2e83" />
                  </View>
                ))}

              <View
                style={[
                  styles.msgBubble,
                  isMine ? styles.msgMine : styles.msgTheirs,
                ]}
              >
                <Text
                  style={isMine ? styles.msgTextMine : styles.msgTextTheirs}
                >
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.plusBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          editable={!chatEnded && chatAccepted}
          placeholder="Type a message..."
          placeholderTextColor="#999"
        />

        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Ionicons name="send" size={18} color="#4b2e83" />
        </TouchableOpacity>
      </View>

      <Modal visible={showSummaryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModal}>
            <Text style={styles.summaryTitle}>Chat Ended</Text>
            <Text style={styles.summaryLine}>
              Duration: {chatSummary?.minutes} minutes
            </Text>
            <Text style={styles.summaryLine}>
              Coins Earned: {chatSummary?.earnings}
            </Text>
            <TouchableOpacity
              style={styles.okButton}
              onPress={() => {
                setShowSummaryModal(false);
                router.replace("/astrologerdashboard/(tabs)/home");
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

const PURPLE = "#4b2e83";
const PURPLE_DARK = "#3c2469";
const CREAM = "#fdf6ee";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },

  header: {
    backgroundColor: PURPLE,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 14,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  backBtn: { marginRight: 6, padding: 4 },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },

  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  name: { color: "#fff", fontSize: 16, fontWeight: "700" },

  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4ade80",
    marginRight: 5,
  },

  statusText: { color: "#e5d9f7", fontSize: 12 },

  rateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },

  rateBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  liveBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  liveLeft: { flexDirection: "row", alignItems: "center", gap: 6 },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },

  liveText: { fontWeight: "700", color: "#2b2b2b", fontSize: 13 },
  liveDivider: { color: "#bbb" },
  liveClock: { fontWeight: "700", color: "#2b2b2b", fontSize: 13 },

  endButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },

  endButtonText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  billingRow: { paddingHorizontal: 16, paddingBottom: 8 },
  billingText: { color: "#555", fontSize: 12 },

  messageList: { flex: 1, paddingHorizontal: 14 },

  msgRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 5 },
  msgRowMine: { justifyContent: "flex-end" },
  msgRowTheirs: { justifyContent: "flex-start" },

  msgAvatar: { width: 26, height: 26, borderRadius: 13, marginRight: 6 },

  msgAvatarFallback: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  msgBubble: { maxWidth: "72%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },

  msgMine: { backgroundColor: PURPLE, borderBottomRightRadius: 4 },

  msgTheirs: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  msgTextMine: { color: "#fff", fontSize: 14 },
  msgTextTheirs: { color: "#222", fontSize: 14 },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: CREAM,
    borderTopWidth: 1,
    borderColor: "#eee0d0",
  },

  plusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PURPLE_DARK,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#222",
  },

  sendBtn: { marginLeft: 8, padding: 6 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryModal: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 14,
    width: "80%",
    alignItems: "center",
  },

  summaryTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: PURPLE },
  summaryLine: { fontSize: 14, color: "#444", marginBottom: 4 },

  okButton: {
    marginTop: 15,
    backgroundColor: PURPLE,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },

  okButtonText: { color: "#fff", fontWeight: "bold" },
});