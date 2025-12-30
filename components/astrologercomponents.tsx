import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";

type Props = {
  _id: string;
  name: string;
  bio?: string;
  skills: string;
  languages: string;
  experience: string;
  price: number;
  oldPrice?: number;
  orders?: number;
  status: "online" | "offline" | "busy" | string;
  waitTime?: string;
  profilePic?: string;
  onChatPress?: () => void;
};

const AstrologerCard: React.FC<Props> = ({
  name,
  bio,
  skills,
  languages,
  experience,
  status,
  waitTime,
  profilePic,
  onChatPress,
}) => {
  const normalizedPic =
    profilePic && profilePic.startsWith("http")
      ? profilePic
      : profilePic
      ? `https://astro-backend-qdu5.onrender.com/${profilePic.replace(/\\/g, "/")}`
      : null;

  return (
    <View style={styles.card}>
      {/* Avatar */}
      {normalizedPic ? (
        <Image source={{ uri: normalizedPic }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Ionicons name="person" size={40} color="#2d1e3f" />
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>

        {bio && (
          <Text style={styles.bio}>
            <Text style={styles.label}>Bio: </Text>
            {bio}
          </Text>
        )}

        <Text style={styles.text}>
          <Text style={styles.label}>Skills: </Text>
          {skills}
        </Text>

        <Text style={styles.text}>
          <Text style={styles.label}>Languages: </Text>
          {languages}
        </Text>

        <Text style={styles.exp}>
          <Text style={styles.label}>Exp: </Text>
          {experience} yrs
        </Text>
      </View>

      {/* Chat Button */}
      {status === "online" ? (
        <TouchableOpacity style={styles.chatBtn} onPress={onChatPress}>
          <Text style={styles.chatText}>Chat</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.offlineWrap}>
          <TouchableOpacity style={styles.chatDisabled}>
            <Text style={styles.chatDisabledText}>Chat</Text>
          </TouchableOpacity>

          {waitTime && (
            <Text style={styles.waitText}>wait ~{waitTime}</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default AstrologerCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2d1e3f",
    marginBottom: 16,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#2d1e3f",
  },

  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2d1e3f",
  },

  info: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d1e3f",
  },

  bio: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },

  label: {
    fontWeight: "600",
    fontStyle: "normal",
    color: "#2d1e3f",
  },

  text: {
    fontSize: 12,
    color: "#4b5563",
  },

  exp: {
    fontSize: 11,
    color: "#2d1e3f",
  },

  chatBtn: {
    backgroundColor: "#2d1e3f",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0c878",
  },

  chatText: {
    color: "#e0c878",
    fontWeight: "700",
  },

  offlineWrap: {
    alignItems: "center",
  },

  chatDisabled: {
    backgroundColor: "#d1d5db",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0c878",
  },

  chatDisabledText: {
    color: "#2d1e3f",
    fontWeight: "700",
  },

  waitText: {
    marginTop: 4,
    fontSize: 10,
    color: "#ef4444",
  },
});
