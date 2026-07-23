import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { apiGetUserChats } from "../../../api/api";

interface ChatPreview {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  lastMessage?: string;
}

// This screen now ONLY shows the list of past chats. Listening for new
// incoming chat requests (the modal, vibration, etc.) is handled once,
// globally, in astrologerdashboard/_layout.tsx -- it used to also happen
// here, which meant two separate modals could pop up for the same
// request, and two separate chat sessions/screens could get created for
// a single accepted chat. Keeping that logic in exactly one place fixes
// both problems.
export default function AstrologerChatList() {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token || !isMounted) return;

      try {
        const res = await apiGetUserChats(token);
        if (isMounted) setChats(res);
      } catch (err) {
        console.error("Failed to load chats:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chats</Text>

      <FlatList
        data={chats}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => (
          <View style={styles.chatItem}>
            <Ionicons name="person-circle-outline" size={42} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.name}>{item.user.name}</Text>
              <Text numberOfLines={1} style={styles.preview}>
                {item.lastMessage || "No messages yet"}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 15 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f3f3f3",
    marginBottom: 10,
    alignItems: "center",
  },
  name: { fontWeight: "bold", fontSize: 16 },
  preview: { fontSize: 12, color: "#555" },
});