import React, { useEffect, useRef, useState } from "react";
import { Stack, useRouter } from "expo-router";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { socket } from "../../lib/socket";
import { apiGetMyProfile } from "../../api/api";

// This layout wraps EVERY screen in the astrologer dashboard (Home, Profile,
// History, AstroForm, Chat). We register the socket connection and the
// "incomingChatRequest" listener HERE instead of on any single tab screen,
// because tabs only mount once you actually visit them. Before this change,
// the listener lived only on the (hidden, unreachable) chat list tab, so it
// almost never ran -- which is why notifications weren't showing up.
export default function AstrologerLayout() {
  const router = useRouter();
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const astrologerIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleIncomingChat = (data: any) => {
      console.log("🔔 INCOMING CHAT REQUEST:", data);
      if (!mounted) return;
      setIncomingRequest(data);
      Vibration.vibrate(400);
    };

    const registerOnline = (astrologerId: string) => {
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit("astrologerOnline", { astrologerId });
    };

    const handleReconnect = () => {
      if (astrologerIdRef.current) {
        console.log("🔄 Reconnected. Registering astrologer again.");
        registerOnline(astrologerIdRef.current);
      }
    };

    const init = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token || !mounted) return;

        // We need the Astrologer PROFILE id (not the User account id) --
        // this is the id the backend uses to route incoming chat requests
        // to this astrologer's socket room.
        const profile = await apiGetMyProfile(token);
        if (!profile?._id || !mounted) return;

        astrologerIdRef.current = profile._id;
        registerOnline(profile._id);

        socket.off("incomingChatRequest", handleIncomingChat);
        socket.on("incomingChatRequest", handleIncomingChat);

        socket.off("connect", handleReconnect);
        socket.on("connect", handleReconnect);
      } catch (err) {
        console.error("Astrologer layout socket init failed:", err);
      }
    };

    init();

    return () => {
      mounted = false;
      socket.off("incomingChatRequest", handleIncomingChat);
      socket.off("connect", handleReconnect);
    };
  }, []);

  const acceptChat = () => {
    if (!incomingRequest) return;

    socket.emit("astrologerAcceptsChat", {
      requestId: incomingRequest.requestId,
      userId: incomingRequest.userId,
    });

    const { userId, requestId } = incomingRequest;
    setIncomingRequest(null);

    // "replace" (not "push") on purpose -- if an old chat screen is
    // somehow still around, this swaps it out instead of stacking a new
    // one on top of it. Stacked screens were the reason earnings/coins
    // looked like they carried over from a previous chat.
    router.replace(
      `/astrologerdashboard/(tabs)/chatpage?userId=${userId}&requestId=${requestId}`
    );
  };

  const rejectChat = () => {
    setIncomingRequest(null);
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />

      <Modal visible={!!incomingRequest} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>New Chat Request</Text>
            <Text style={styles.subtitle}>
              User: {incomingRequest?.userName || "Unknown"}
            </Text>

            <View style={styles.row}>
              <TouchableOpacity style={styles.accept} onPress={acceptChat}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.reject} onPress={rejectChat}>
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 30,
  },
  modal: {
    backgroundColor: "#2d1e3f",
    padding: 22,
    borderRadius: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e0c878",
    marginBottom: 6,
  },
  subtitle: {
    color: "#cccccc",
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  accept: {
    flex: 1,
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 10,
    marginRight: 8,
    alignItems: "center",
  },
  acceptText: {
    color: "white",
    fontWeight: "bold",
  },
  reject: {
    flex: 1,
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: "center",
  },
  rejectText: {
    color: "white",
    fontWeight: "bold",
  },
});