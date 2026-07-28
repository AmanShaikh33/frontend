import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  apiGetMyProfile,
  apiGetMe,
  apiUpdateProfile,
} from "../../../api/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const BASE_URL = "https://astro-backend-qdu5.onrender.com";

export default function Profile() {
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [languages, setLanguages] = useState("");
  const [price, setPrice] = useState("");
  const [experience, setExperience] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const userData = await apiGetMe(token);
      setUserName(userData.name);

      const data = await apiGetMyProfile(token);
      setProfile(data);

      setName(data.name || "");
      setBio(data.bio || "");
      setSkills(
        Array.isArray(data.skills) ? data.skills.join(", ") : data.skills || ""
      );
      setLanguages(
        Array.isArray(data.languages)
          ? data.languages.join(", ")
          : data.languages || ""
      );
      setPrice(data.pricePerMinute?.toString() || "");
      setExperience(data.experience?.toString() || "");
    } catch (err) {
  console.log("No profile found. Redirecting to form...");
  router.replace("/astrologerdashboard/(tabs)/astroform");
  return;
}finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      formData.append("skills", skills);
      formData.append("languages", languages);
      formData.append("pricePerMinute", price);
      formData.append("experience", experience);

      await apiUpdateProfile(token, formData);

      await fetchProfile();
      Alert.alert("Success", "Profile updated!");
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e0672c" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No profile data found</Text>
      </View>
    );
  }

  const imageUrl = profile.profilePic
  ? `${BASE_URL}${profile.profilePic}`
  : null;
  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#e0c878" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
        
          <View style={styles.imageBox}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.noImage}>
                <Ionicons name="person-outline" size={36} color="#a3915a" />
              </View>
            )}
            <Text style={styles.name}>
              {profile.name || userName}
            </Text>

            <View
              style={[
                styles.approval,
                profile.isApproved === "approved" ? styles.approved : styles.pending,
              ]}
            >
              <Ionicons
                name={profile.isApproved === "approved" ? "checkmark-circle" : "time-outline"}
                size={14}
                color={profile.isApproved === "approved" ? "#2f9e44" : "#e0a800"}
              />
              <Text
                style={[
                  styles.approvalText,
                  { color: profile.isApproved === "approved" ? "#2f9e44" : "#e0a800" },
                ]}
              >
                {profile.isApproved === "approved" ? "Approved" : "Pending Approval"}
              </Text>
            </View>
          </View>

          <View style={styles.infoList}>
            {renderRow("chatbubble-outline", "Bio", profile.bio)}
            {renderRow(
              "star-outline",
              "Skills",
              Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills
            )}
            {renderRow(
              "language-outline",
              "Languages",
              Array.isArray(profile.languages) ? profile.languages.join(", ") : profile.languages
            )}
            {renderRow("cash-outline", "Price per Minute", `₹${profile.pricePerMinute}`)}
            {renderRow("ribbon-outline", "Experience", `${profile.experience} years`)}
          </View>

          {profile.isApproved === "approved" ? (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.waitBox}>
              <Ionicons name="hourglass-outline" size={16} color="#8a6d1f" />
              <Text style={styles.waitText}>
                You can edit your profile after approval.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {renderInput("Name", name, setName, "person-outline")}
              {renderInput("Bio", bio, setBio, "chatbubble-outline", true)}
              {renderInput("Skills", skills, setSkills, "star-outline")}
              {renderInput("Languages", languages, setLanguages, "language-outline")}
              {renderInput("Price per Minute", price, setPrice, "cash-outline", false, "numeric")}
              {renderInput("Experience", experience, setExperience, "ribbon-outline", false, "numeric")}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditModalVisible(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleUpdateProfile}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const renderRow = (icon: string, label: string, value: any) => (
  <View style={styles.row}>
    <View style={styles.rowIconBadge}>
      <Ionicons name={icon as any} size={16} color="#a3915a" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  </View>
);

const renderInput = (
  placeholder: string,
  value: string,
  setValue: any,
  icon: string = "create-outline",
  multiline = false,
  keyboardType: any = "default"
) => (
  <View style={[styles.inputRow, multiline && styles.inputRowMultiline]}>
    <Ionicons name={icon as any} size={18} color="#a3915a" style={multiline ? { marginTop: 12 } : undefined} />
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#c2b280"
      value={value}
      onChangeText={setValue}
      multiline={multiline}
      keyboardType={keyboardType}
      style={[styles.input, multiline && styles.inputMultiline]}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f5f0" },
  empty: { color: "#8a7f6a", fontSize: 15 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#2d1e3f",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: "#e0c878",
    fontSize: 18,
    fontWeight: "700",
  },

  scroll: { padding: 16, paddingBottom: 60 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f0ebe0",
    shadowColor: "#2d1e3f",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  imageBox: { alignItems: "center", marginBottom: 22 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#f3e8c9",
    marginBottom: 10,
  },
  noImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#fffdf7",
    borderWidth: 1.5,
    borderColor: "#eee0bd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  name: { fontSize: 19, fontWeight: "700", color: "#2d1e3f", marginBottom: 8 },

  approval: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  approved: { backgroundColor: "#eafbea" },
  pending: { backgroundColor: "#fff6e0" },
  approvalText: { fontWeight: "700", fontSize: 12 },

  infoList: { marginTop: 4, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f2efe8",
  },
  rowIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fffdf7",
    borderWidth: 1,
    borderColor: "#eee0bd",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  label: { fontWeight: "600", color: "#a89f8c", fontSize: 11, marginBottom: 2, letterSpacing: 0.3 },
  value: { color: "#2d1e3f", fontSize: 14 },

  editBtn: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e0672c",
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#e0672c",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  editText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  waitBox: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff6e0",
    paddingVertical: 14,
    borderRadius: 18,
  },
  waitText: { color: "#8a6d1f", fontWeight: "600", fontSize: 12, textAlign: "center", flexShrink: 1 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20,14,30,0.55)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#2d1e3f",
    marginBottom: 16,
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.2,
    borderColor: "#eee0bd",
    backgroundColor: "#fffdf7",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputRowMultiline: {
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: "#2d1e3f",
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#f2efe8",
    paddingVertical: 13,
    borderRadius: 22,
    alignItems: "center",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#e0672c",
    paddingVertical: 13,
    borderRadius: 22,
    alignItems: "center",
  },
  cancelBtnText: { color: "#5c5347", fontWeight: "700" },
  saveText: { color: "#fff", fontWeight: "700" },
});