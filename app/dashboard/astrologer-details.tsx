import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGetAstrologerById } from "../../api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://astro-backend-qdu5.onrender.com";
const BIO_PREVIEW_LENGTH = 110;

export default function AstrologerDetails() {
  const { astrologerId } = useLocalSearchParams();
  const router = useRouter();

  const [astro, setAstro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          router.replace("/login");
          return;
        }

        const data = await apiGetAstrologerById(token, astrologerId as string);
        setAstro(data);
      } catch (err) {
        console.log("Failed to fetch astrologer:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  if (!astro) {
    return (
      <View style={styles.center}>
        <Text>No details found.</Text>
      </View>
    );
  }

  const imageUrl = astro.profilePic ? `${BASE_URL}${astro.profilePic}` : null;
  const isOnline = astro.availability === "online";

  const skillsList: string[] = Array.isArray(astro.skills)
    ? astro.skills
    : astro.skills
    ? String(astro.skills).split(",").map((s: string) => s.trim())
    : [];

  const languagesText = Array.isArray(astro.languages)
    ? astro.languages.join(" • ")
    : astro.languages || "—";

  const bio: string = astro.bio || "No bio available.";
  const isLongBio = bio.length > BIO_PREVIEW_LENGTH;
  const displayedBio =
    isLongBio && !bioExpanded ? `${bio.slice(0, BIO_PREVIEW_LENGTH)}...` : bio;

  const rating = astro.rating ?? "4.9";
  const reviewCount = astro.reviewCount ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Photo header */}
        <View style={styles.photoWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoFallback}>
              <Ionicons name="person" size={70} color="#2d1e3f" />
            </View>
          )}

          <View style={styles.topOverlayRow}>
            <TouchableOpacity
              style={styles.overlayCircleBtn}
              onPress={() => router.back()}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.topRightIcons}>
              <TouchableOpacity
                style={styles.overlayCircleBtn}
                onPress={() => setIsFavorite((prev) => !prev)}
                hitSlop={10}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={18}
                  color={isFavorite ? "#e0672c" : "#fff"}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.overlayCircleBtn} hitSlop={10}>
                <Ionicons name="share-social-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.onlineBadge}>
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: isOnline ? "#22c55e" : "#9ca3af" },
              ]}
            />
            <Text style={styles.onlineBadgeText}>
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        {/* Overlapping info card */}
        <View style={styles.card}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{astro.name}</Text>
            <Ionicons name="checkmark-circle" size={18} color="#3b82f6" style={{ marginLeft: 6 }} />
          </View>

          {skillsList.length > 0 && (
            <Text style={styles.category} numberOfLines={1}>
              {skillsList.join(" • ")}
            </Text>
          )}

          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color="#f5b400" />
            <Text style={styles.metaText}>
              {rating} <Text style={styles.metaDim}>({reviewCount} Reviews)</Text>
            </Text>
            <Text style={styles.metaDim}>  •  {astro.experience}+ Years Exp.</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹ {astro.pricePerMinute}/min</Text>

            <TouchableOpacity
              style={[styles.talkBtn, !isOnline && styles.talkBtnDisabled]}
              disabled={!isOnline}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/dashboard/chatpage",
                  params: { astrologerId: astro._id },
                })
              }
            >
              <Text
                style={[
                  styles.talkBtnText,
                  !isOnline && styles.talkBtnTextDisabled,
                ]}
              >
                {isOnline ? "Talk to her" : "Offline"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* About */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.text}>{displayedBio}</Text>
          {isLongBio && (
            <TouchableOpacity onPress={() => setBioExpanded((prev) => !prev)}>
              <Text style={styles.readMore}>
                {bioExpanded ? "Show less" : "Read more"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Specialties */}
          {skillsList.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Specialties</Text>
              <View style={styles.chipRow}>
                {skillsList.map((skill, idx) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Languages */}
          <Text style={styles.sectionTitle}>Languages</Text>
          <Text style={styles.text}>{languagesText}</Text>

          {/* Reviews */}
          <TouchableOpacity style={styles.reviewsRow} activeOpacity={0.7}>
            <View style={styles.reviewsLeft}>
              <Text style={styles.reviewsTitle}>Reviews ({reviewCount})</Text>
              <Ionicons name="chevron-forward" size={16} color="#2d1e3f" />
            </View>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  photoWrap: {
    width: "100%",
    height: 340,
    backgroundColor: "#2d1e3f",
  },

  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  photoFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  topOverlayRow: {
    position: "absolute",
    top: 44,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  topRightIcons: {
    flexDirection: "row",
    gap: 10,
  },

  overlayCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  onlineBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  onlineBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#fff",
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 22,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    fontSize: 21,
    fontWeight: "700",
    color: "#2d1e3f",
  },

  category: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
  },

  metaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2d1e3f",
  },

  metaDim: {
    fontSize: 13,
    fontWeight: "400",
    color: "#9ca3af",
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },

  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e0672c",
  },

  talkBtn: {
    borderWidth: 1.5,
    borderColor: "#2d1e3f",
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  talkBtnDisabled: {
    borderColor: "#d1d5db",
  },

  talkBtnText: {
    color: "#2d1e3f",
    fontWeight: "700",
    fontSize: 14,
  },

  talkBtnTextDisabled: {
    color: "#9ca3af",
  },

  divider: {
    height: 1,
    backgroundColor: "#f2efe8",
    marginVertical: 18,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d1e3f",
    marginTop: 18,
  },

  text: {
    marginTop: 6,
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
  },

  readMore: {
    marginTop: 4,
    color: "#e0672c",
    fontWeight: "700",
    fontSize: 13,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },

  chip: {
    backgroundColor: "#f7f5f0",
    borderWidth: 1,
    borderColor: "#eee0bd",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2d1e3f",
  },

  reviewsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 24,
  },

  reviewsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  reviewsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d1e3f",
  },

  seeAll: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e0672c",
  },
});