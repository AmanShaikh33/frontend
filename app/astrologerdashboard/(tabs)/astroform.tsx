import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCreateProfile, apiGetMyProfile } from "../../../api/api";

export default function AstroForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [languages, setLanguages] = useState("");
  const [price, setPrice] = useState("");
  const [experience, setExperience] = useState("");
  const [profilePic, setProfilePic] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileExists, setProfileExists] = useState(false);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await apiGetMyProfile(token);
      if (res.profile) {
        setProfileExists(true);
        setName(res.profile.name || "");
        setBio(res.profile.bio || "");
        setSkills(res.profile.skills?.join(", ") || "");
        setLanguages(res.profile.languages?.join(", ") || "");
        setPrice(String(res.profile.pricePerMinute || ""));
        setExperience(String(res.profile.experience || ""));
        if (res.profile.profilePic)
          setProfilePic({ uri: res.profile.profilePic });
      }
    } catch {
      console.log("No profile yet");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const pickImage = async () => {
    if (profileExists) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0]);
    }
  };

  const handleCreateProfile = async () => {
    if (!name || !bio || !skills || !languages || !price || !experience) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      formData.append("skills", skills);
      formData.append("languages", languages);
      formData.append("pricePerMinute", price);
      formData.append("experience", experience);

      if (profilePic && !profileExists) {
        formData.append("profilePic", {
          uri: profilePic.uri,
          type: "image/jpeg",
          name: "profile.jpg",
        } as any);
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      await apiCreateProfile(token, formData);
      Alert.alert("Success", "Profile created successfully!");
      setProfileExists(true);
      await AsyncStorage.setItem("profileExists", "true");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#e0672c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#e0c878" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {profileExists ? "Your Profile" : "Create Profile"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <TouchableOpacity
              style={styles.avatarTouchable}
              onPress={pickImage}
              disabled={profileExists}
              activeOpacity={0.85}
            >
              {profilePic ? (
                <Image source={{ uri: profilePic.uri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera-outline" size={26} color="#a3915a" />
                </View>
              )}
              {!profileExists && (
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="pencil" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.avatarHint}>
              {profilePic
                ? profileExists
                  ? "Profile picture uploaded"
                  : "Tap to change picture"
                : "Tap to upload picture"}
            </Text>
          </View>

          {renderInput("Name", name, setName, profileExists, "person-outline")}
          {renderInput("Bio", bio, setBio, profileExists, "chatbubble-outline", true)}
          {renderInput("Skills (comma separated)", skills, setSkills, profileExists, "star-outline")}
          {renderInput("Languages (comma separated)", languages, setLanguages, profileExists, "language-outline")}
          {renderInput("Price per Minute (₹)", price, setPrice, profileExists, "cash-outline", false, "numeric")}
          {renderInput("Experience (years)", experience, setExperience, profileExists, "ribbon-outline", false, "numeric")}

          {!profileExists && (
            <TouchableOpacity style={styles.createBtn} onPress={handleCreateProfile} activeOpacity={0.85}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createText}>Create Profile</Text>
              )}
            </TouchableOpacity>
          )}

          {profileExists && (
            <View style={styles.doneBox}>
              <Ionicons name="checkmark-circle" size={20} color="#2f9e44" />
              <Text style={styles.doneText}>Profile Created!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- helper ---------- */
const renderInput = (
  label: string,
  value: string,
  setValue: any,
  disabled: boolean,
  icon: string = "create-outline",
  multiline = false,
  keyboardType: any = "default"
) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputRow, multiline && styles.inputRowMultiline]}>
      <Ionicons name={icon as any} size={18} color="#a3915a" style={multiline ? { marginTop: 12 } : undefined} />
      <TextInput
        value={value}
        onChangeText={setValue}
        editable={!disabled}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor="#c2b280"
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f5f0",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f5f0",
  },

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
    fontSize: 18,
    fontWeight: "700",
    color: "#e0c878",
  },

  scroll: {
    padding: 16,
    paddingBottom: 60,
  },

  card: {
    backgroundColor: "#ffffff",
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

  avatarWrap: {
    alignItems: "center",
    marginBottom: 22,
  },
  avatarTouchable: {
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#f3e8c9",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fffdf7",
    borderWidth: 1.5,
    borderColor: "#eee0bd",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e0672c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#8a7f6a",
  },

  label: {
    color: "#8a7f6a",
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
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
  },
  inputRowMultiline: {
    alignItems: "flex-start",
    paddingVertical: 4,
  },

  input: {
    flex: 1,
    color: "#2d1e3f",
    paddingVertical: 12,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: "top",
    paddingTop: 10,
  },

  createBtn: {
    backgroundColor: "#e0672c",
    paddingVertical: 15,
    borderRadius: 26,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#e0672c",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  createText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },

  doneBox: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eafbea",
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 8,
  },

  doneText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2f9e44",
  },
});