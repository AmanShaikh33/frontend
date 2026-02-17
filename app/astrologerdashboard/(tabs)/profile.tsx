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

const BASE_URL = "https://astrologyapp-1.onrender.com";

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
      console.error(err);
    } finally {
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
        <ActivityIndicator size="large" color="#e0c878" />
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
    ? profile.profilePic.startsWith("http")
      ? profile.profilePic
      : `${BASE_URL}/${profile.profilePic.replace(/\\/g, "/")}`
    : null;

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#e0c878" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
        
          <View style={styles.imageBox}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.noImage}>
                <Text>No Image</Text>
              </View>
            )}
            <Text style={styles.name}>
              {profile.name || userName}
            </Text>
          </View>

          {renderRow("Bio", profile.bio)}
          {renderRow(
            "Skills",
            Array.isArray(profile.skills)
              ? profile.skills.join(", ")
              : profile.skills
          )}
          {renderRow(
            "Languages",
            Array.isArray(profile.languages)
              ? profile.languages.join(", ")
              : profile.languages
          )}
          {renderRow("Price per Minute (₹)", profile.pricePerMinute)}
          {renderRow("Experience", `${profile.experience} years`)}

          <View
            style={[
              styles.approval,
              profile.isApproved === "approved"
                ? styles.approved
                : styles.pending,
            ]}
          >
            <Text style={styles.approvalText}>
              Approval: {profile.isApproved || "pending"}
            </Text>
          </View>

          {profile.isApproved === "approved" ? (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditModalVisible(true)}
            >
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.waitBox}>
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

            <ScrollView>
              {renderInput("Name", name, setName)}
              {renderInput("Bio", bio, setBio, true)}
              {renderInput("Skills", skills, setSkills)}
              {renderInput("Languages", languages, setLanguages)}
              {renderInput("Price per Minute", price, setPrice, false, "numeric")}
              {renderInput("Experience", experience, setExperience, false, "numeric")}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleUpdateProfile}
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


const renderRow = (label: string, value: any) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const renderInput = (
  placeholder: string,
  value: string,
  setValue: any,
  multiline = false,
  keyboardType: any = "default"
) => (
  <TextInput
    placeholder={placeholder}
    value={value}
    onChangeText={setValue}
    multiline={multiline}
    keyboardType={keyboardType}
    style={styles.input}
  />
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { color: "#6b7280", fontSize: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#2d1e3f",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#e0c878",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 24,
  },

  scroll: { padding: 16, paddingBottom: 120 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  imageBox: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: "#e0c878",
    marginBottom: 8,
  },
  noImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 20, fontWeight: "700", color: "#2d1e3f" },

  row: { marginBottom: 12 },
  label: { fontWeight: "600", color: "#374151" },
  value: { color: "#111827" },

  approval: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  approved: { backgroundColor: "#dcfce7" },
  pending: { backgroundColor: "#fef9c3" },
  approvalText: { fontWeight: "600" },

  editBtn: {
    marginTop: 16,
    backgroundColor: "#e0c878",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editText: { color: "#2d1e3f", fontWeight: "700", fontSize: 16 },

  waitBox: {
    marginTop: 16,
    backgroundColor: "#fef3c7",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  waitText: { color: "#92400e", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d1e3f",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    color: "#000",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelBtn: {
    backgroundColor: "#9ca3af",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveBtn: {
    backgroundColor: "#e0c878",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  saveText: { color: "#2d1e3f", fontWeight: "700" },
});
