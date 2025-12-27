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
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#e0c878" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {profileExists ? "Your Profile" : "Create Profile"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          {renderInput("Name", name, setName, profileExists)}
          {renderInput("Bio", bio, setBio, profileExists, true)}
          {renderInput("Skills (comma separated)", skills, setSkills, profileExists)}
          {renderInput("Languages (comma separated)", languages, setLanguages, profileExists)}
          {renderInput("Price per Minute (₹)", price, setPrice, profileExists, false, "numeric")}
          {renderInput("Experience (years)", experience, setExperience, profileExists, false, "numeric")}

          <Text style={styles.label}>Profile Picture</Text>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={pickImage}
            disabled={profileExists}
          >
            <Text style={styles.uploadText}>
              {profilePic
                ? profileExists
                  ? "Profile Picture Uploaded"
                  : "Change Profile Picture"
                : "Upload Profile Picture"}
            </Text>
          </TouchableOpacity>

          {profilePic && (
            <Image source={{ uri: profilePic.uri }} style={styles.avatar} />
          )}

          {!profileExists && (
            <TouchableOpacity style={styles.createBtn} onPress={handleCreateProfile}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#2d1e3f" />
              ) : (
                <Text style={styles.createText}>Create Profile</Text>
              )}
            </TouchableOpacity>
          )}

          {profileExists && (
            <View style={styles.doneBox}>
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
  multiline = false,
  keyboardType: any = "default"
) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={setValue}
      editable={!disabled}
      multiline={multiline}
      keyboardType={keyboardType}
      placeholderTextColor="#9e8b4e"
      style={styles.input}
    />
  </>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#2d1e3f",
  },

  headerTitle: {
    marginLeft: 50,
    fontSize: 18,
    fontWeight: "700",
    color: "#e0c878",
  },

  scroll: {
    padding: 16,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  label: {
    color: "#374151",
    marginBottom: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e0c878",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    color: "#000",
  },

  uploadBtn: {
    backgroundColor: "#e0c878",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },

  uploadText: {
    color: "#2d1e3f",
    fontWeight: "700",
  },

  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignSelf: "center",
    marginBottom: 16,
  },

  createBtn: {
    backgroundColor: "#e0c878",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },

  createText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d1e3f",
  },

  doneBox: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },

  doneText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },
});
