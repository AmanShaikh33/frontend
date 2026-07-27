import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";

const BASE_URL = "https://astro-backend-qdu5.onrender.com";

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
  rating?: number;
  reviewCount?: number | string;
  status: "online" | "offline" | "busy" | string;
  waitTime?: string;
  profilePic?: string;
  onPress?: () => void;
  onChatPress?: () => void;
};

const AstrologerCard: React.FC<Props> = ({
  name,
  skills,
  experience,
  status,
  profilePic,
  price,
  rating,
  reviewCount,
  onPress,
}) => {
  const normalizedPic = profilePic ? `${BASE_URL}${profilePic}` : null;
  const isOnline = status === "online";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {/* Avatar */}
      {normalizedPic ? (
        <Image source={{ uri: normalizedPic }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Ionicons name="person" size={28} color="#2d1e3f" />
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? "#16a34a" : "#9ca3af" },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOnline ? "#16a34a" : "#9ca3af" },
            ]}
          >
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>

        <Text style={styles.skills} numberOfLines={1}>
          {skills}
        </Text>

        <Text style={styles.exp}>{experience}+ Years Exp.</Text>

        <View style={styles.bottomRow}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#f5b400" />
            <Text style={styles.ratingText}>
              {rating ?? "4.9"}{" "}
              <Text style={styles.reviewText}>({reviewCount ?? "0"})</Text>
            </Text>
          </View>

          <Text style={styles.price}>₹ {price}/min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default AstrologerCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee0bd",
    marginBottom: 12,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },

  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  info: {
    flex: 1,
    marginLeft: 12,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d1e3f",
    marginRight: 6,
    maxWidth: "60%",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  skills: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  exp: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2d1e3f",
  },

  reviewText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9ca3af",
  },

  price: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e0672c",
  },
});