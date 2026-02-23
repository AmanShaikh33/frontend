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
} from "../../api/api";

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
}

export default function UserChatPage() {
  const { astrologerId } =
    useLocalSearchParams<{ astrologerId: string }>();

  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [astrologerInfo, setAstrologerInfo] = useState<any>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [waitingForAcceptance, setWaitingForAcceptance] =
    useState(true);
  const [chatEnded, setChatEnded] = useState(false);

  const [userCoins, setUserCoins] = useState(0);
  const [sessionCost, setSessionCost] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSummaryModal, setShowSummaryModal] =
    useState(false);
  const [chatSummary, setChatSummary] = useState<any>(null);

  const hasEmittedRequest = useRef(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token || !astrologerId || !mounted) return;

        const decoded: any = jwtDecode(token);
        setUserId(decoded.id);

        if (!socket.connected) {
          socket.connect();
          await new Promise<void>((resolve) => {
            socket.once("connect", () => resolve());
          });
        }

        socket.emit("userOnline", { userId: decoded.id });

        const astro = await apiGetAstrologerById(
          token,
          astrologerId
        );
        setAstrologerInfo(astro);

        const profile = await apiGetMe(token);
        setUserCoins(profile.coins || 0);

        // Remove old listeners safely
        socket.off("chat-accepted");
        socket.off("minute-billed");
        socket.off("timer-tick");
        socket.off("force-end-chat");
        socket.off("chatEnded");
        socket.off("receiveMessage");
        socket.off("insufficient-coins");

        socket.on(
          "insufficient-coins",
          ({ required, current }) => {
            if (!mounted) return;

            setWaitingForAcceptance(false);

            Alert.alert(
              "Insufficient Coins",
              `You need ${required} coins. You have ${current}.`
            );
          }
        );

        socket.once(
          "chat-accepted",
          async ({ sessionId }) => {
            if (!mounted) return;

            setSessionId(sessionId);
            setWaitingForAcceptance(false);
            setChatEnded(false);
            setElapsedTime(0);
            setMessages([]);

            socket.emit("joinSession", { sessionId });

            const msgs = await apiGetMessages(
              token,
              sessionId
            );
            setMessages(msgs);
          }
        );

        // Backend timer source of truth
        socket.on(
          "timer-tick",
          ({ elapsedSeconds }) => {
            if (!mounted) return;
            setElapsedTime(elapsedSeconds);
          }
        );

        socket.on(
          "minute-billed",
          ({ minutes, coinsLeft }) => {
            if (!mounted) return;

            setUserCoins(coinsLeft);
            setSessionCost(
              minutes * (astro.pricePerMinute || 0)
            );
          }
        );

        socket.on(
          "force-end-chat",
          ({ reason }) => {
            if (!mounted) return;

            setChatEnded(true);

            Alert.alert(
              "Chat Ended",
              reason === "INSUFFICIENT_COINS"
                ? "Insufficient coins"
                : "Chat ended"
            );
          }
        );

        socket.on(
          "chatEnded",
          ({ totalCoins }) => {
            if (!mounted) return;

            setChatEnded(true);

            const minutes = Math.floor(
              elapsedTime / 60
            );

            setChatSummary({
              minutes,
              coinsDeducted:
                totalCoins || sessionCost,
            });

            setShowSummaryModal(true);
          }
        );

        socket.on("receiveMessage", (msg: Message) => {
          if (!mounted) return;
          setMessages((prev) => [...prev, msg]);
        });

        if (!hasEmittedRequest.current) {
          socket.emit("userRequestsChat", {
            astrologerId,
            userId: decoded.id,
            userName: decoded.name || "User",
          });

          hasEmittedRequest.current = true;
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();

    const backHandler =
      BackHandler.addEventListener(
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

      socket.off("chat-accepted");
      socket.off("minute-billed");
      socket.off("timer-tick");
      socket.off("force-end-chat");
      socket.off("chatEnded");
      socket.off("receiveMessage");
      socket.off("insufficient-coins");
    };
  }, [astrologerId]);

  const sendMessage = () => {
    if (!sessionId || chatEnded || !newMessage.trim())
      return;

    socket.emit("sendMessage", {
      sessionId,
      senderId: userId,
      receiverId: astrologerId,
      content: newMessage,
    });

    setNewMessage("");
  };

  const endChat = () => {
    if (!sessionId || chatEnded) return;

    Alert.alert("End Chat", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: () => {
          socket.emit("endChat", {
            roomId: sessionId,
            endedBy: "user",
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {astrologerInfo
          ? `Chat with ${astrologerInfo.name}`
          : "Loading..."}
      </Text>

      {waitingForAcceptance && (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>
            ⏳ Waiting for astrologer...
          </Text>
        </View>
      )}

      {sessionId && !chatEnded && (
        <View style={styles.billingContainer}>
          <Text style={styles.billing}>
            Coins: {userCoins} | Cost: {sessionCost} |
            ⏱️ {Math.floor(elapsedTime / 60)}:
            {(elapsedTime % 60)
              .toString()
              .padStart(2, "0")}
          </Text>

          <TouchableOpacity
            onPress={endChat}
            style={styles.endButton}
          >
            <Text style={styles.endButtonText}>
              End Chat
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(i, idx) =>
          i._id ?? idx.toString()
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.msg,
              item.senderId === userId
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
          editable={!!sessionId && !chatEnded}
          placeholder={
            sessionId
              ? "Type a message..."
              : "Waiting..."
          }
        />

        <TouchableOpacity onPress={sendMessage}>
          <Text style={styles.send}>Send</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSummaryModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModal}>
            <Text style={styles.summaryTitle}>
              Chat Ended
            </Text>
            <Text>
              Duration: {chatSummary?.minutes || 0} min
            </Text>
            <Text>
              Coins Deducted:{" "}
              {chatSummary?.coinsDeducted || 0}
            </Text>
            <TouchableOpacity
              style={styles.okButton}
              onPress={() => {
                setShowSummaryModal(false);
                router.replace(
                  "/dashboard/(tabs)/home"
                );
              }}
            >
              <Text style={styles.okButtonText}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}