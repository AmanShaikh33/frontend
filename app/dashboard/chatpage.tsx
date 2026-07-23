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
  const sessionIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string>("");
  const rateRef = useRef<number>(0);

  // A smooth, per-second running total for display only. The real coin
  // deduction still happens once per full minute on the server (accurate,
  // never fractional) -- this just gives a "live" feel between those
  // billed minutes instead of the number sitting still for 60s at a time.
  // It's automatically corrected to the server's real value the moment
  // each minute actually gets billed, so it can never drift far.
  const liveCost = sessionCost + (rateRef.current * (elapsedTime % 60)) / 60;

  useEffect(() => {
    let mounted = true;

    // Defined at effect scope (not inside init) so the cleanup below can
    // remove this exact listener. Reads AsyncStorage itself and uses refs
    // instead of closed-over state, since it may fire long after mount.
    const handleReconnect = async () => {
      if (!mounted) return;
      const currentUserId = userIdRef.current;
      if (currentUserId) socket.emit("userOnline", { userId: currentUserId });

      const currentSessionId = sessionIdRef.current;
      if (!currentSessionId) return;

      socket.emit("joinSession", { sessionId: currentSessionId });
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        const msgs = await apiGetMessages(token, currentSessionId);
        if (mounted) setMessages(msgs);
      } catch (e) {
        console.error("Failed to resync messages on reconnect:", e);
      }
    };

    const init = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token || !astrologerId || !mounted) return;

        const decoded: any = jwtDecode(token);
        setUserId(decoded.id);
        userIdRef.current = decoded.id;

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
        rateRef.current = astro.pricePerMinute || 0;

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
            sessionIdRef.current = sessionId;
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

        // Server restarted (Render free-tier spin-down, deploy, crash) and
        // has settled up any missed billing. Rejoin the room so live
        // updates keep flowing, and quietly re-sync message history in
        // case anything was sent while we were disconnected.
        socket.off("session-resumed");
        socket.on("session-resumed", async ({ sessionId: resumedId }) => {
          if (!mounted || resumedId !== sessionIdRef.current) return;

          socket.emit("joinSession", { sessionId: resumedId });

          try {
            const msgs = await apiGetMessages(token, resumedId);
            if (mounted) setMessages(msgs);
          } catch (e) {
            console.error("Failed to resync messages after resume:", e);
          }
        });

        // Covers the more common case: the socket itself reconnects
        // (brief network drop, phone backgrounded, etc.) without the
        // server necessarily restarting. Without this, the client can
        // silently stop receiving anything for an active session.
        socket.off("connect", handleReconnect);
        socket.on("connect", handleReconnect);

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
      socket.off("session-resumed");
      socket.off("connect", handleReconnect);
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
            Coins: {userCoins} | Cost: {Math.floor(liveCost)} |
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },

  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  waitingContainer: {
    padding: 10,
    alignItems: "center",
  },

  waitingText: {
    fontSize: 16,
    color: "gray",
  },

  billingContainer: {
    padding: 8,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    marginBottom: 8,
  },

  billing: {
    fontSize: 14,
    marginBottom: 5,
  },

  endButton: {
    backgroundColor: "red",
    padding: 6,
    borderRadius: 6,
    alignItems: "center",
  },

  endButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  msg: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
    maxWidth: "75%",
  },

  mine: {
    alignSelf: "flex-end",
    backgroundColor: "#d1e7dd",
  },

  theirs: {
    alignSelf: "flex-start",
    backgroundColor: "#f8d7da",
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ccc",
    padding: 5,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 5,
  },

  send: {
    color: "blue",
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryModal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  okButton: {
    marginTop: 15,
    backgroundColor: "green",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },

  okButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});