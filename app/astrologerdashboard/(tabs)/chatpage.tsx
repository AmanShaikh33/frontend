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
  const { userId, requestId } =
    useLocalSearchParams<{ userId: string; requestId?: string }>();

  const navigation = useNavigation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoomId, setChatRoomId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [astrologerId, setAstrologerId] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userCoins, setUserCoins] = useState(0);
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
      setUserCoins(userDetails.coins || 0);

      const astroProfile = await apiGetMyProfile(token);
      const rate = astroProfile.pricePerMinute || 90;

      // Remove old listeners safely
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

      // 🔥 Backend is source of truth for timer
      socket.on("timer-tick", ({ elapsedSeconds }) => {
        if (!mounted) return;
        setElapsedTime(elapsedSeconds);
      });

      socket.on("minute-billed", ({ minutes, coinsLeft }) => {
        if (!mounted) return;
        setUserCoins(coinsLeft);
        setSessionEarnings(minutes * rate);
      });

      socket.on("force-end-chat", () => {
        if (!mounted) return;
        setChatEnded(true);
        Alert.alert("Chat Ended");
      });

      socket.on("chatEnded", ({ sessionEarnings: earnings }) => {
        if (!mounted) return;

        setChatEnded(true);

        const minutes = Math.floor(elapsedTime / 60);

        setChatSummary({
          minutes,
          earnings: earnings || sessionEarnings,
        });

        setShowSummaryModal(true);
      });

      if (requestId) {
        socket.emit("astrologerAcceptsChat", {
          requestId,
          userId,
        });
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
          socket.emit("endChat", {
            roomId: chatRoomId,
            endedBy: "astrologer",
          });
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
          socket.emit("endChat", {
            roomId: chatRoomId,
            endedBy: "astrologer",
          });
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ textAlign: "center", fontSize: 18, marginTop: 10 }}>
        {userInfo ? `Chat with ${userInfo.name}` : "Loading..."}
      </Text>

      {chatAccepted && chatRoomId && (
        <View style={{ padding: 10 }}>
          <Text>
            💰 User: {userCoins} | Earnings: {sessionEarnings} | ⏱️{" "}
            {Math.floor(elapsedTime / 60)}:
            {(elapsedTime % 60).toString().padStart(2, "0")}
          </Text>

          <TouchableOpacity onPress={endChat}>
            <Text style={{ color: "red", marginTop: 5 }}>End Chat</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(i, idx) => i._id ?? idx.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf:
                item.senderId === astrologerId
                  ? "flex-end"
                  : "flex-start",
              backgroundColor: "#eee",
              padding: 8,
              margin: 5,
              borderRadius: 8,
            }}
          >
            <Text>{item.content}</Text>
          </View>
        )}
      />

      <View style={{ flexDirection: "row", padding: 10 }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            padding: 8,
            borderRadius: 5,
          }}
          value={newMessage}
          onChangeText={setNewMessage}
          editable={!chatEnded && chatAccepted}
          placeholder="Type a message..."
        />
        <TouchableOpacity onPress={sendMessage}>
          <Text style={{ marginLeft: 10, marginTop: 10 }}>Send</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSummaryModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#000000aa",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
            }}
          >
            <Text>Chat Ended</Text>
            <Text>Duration: {chatSummary?.minutes} minutes</Text>
            <Text>Coins Earned: {chatSummary?.earnings}</Text>
            <TouchableOpacity
              onPress={() => {
                setShowSummaryModal(false);
                router.replace(
                  "/astrologerdashboard/(tabs)/home"
                );
              }}
            >
              <Text style={{ marginTop: 10 }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}