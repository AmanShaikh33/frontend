import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiResetPassword } from "../../api/api";

export default function ResetPassword() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!token.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter token and new password");
      return;
    }

    try {
      setLoading(true);

      await apiResetPassword(token.trim(), password.trim());

      Alert.alert("Success", "Password updated successfully");

      router.replace("/(auth)/login");

    } catch (error: any) {
  console.log("RESET ERROR:", error);
  Alert.alert("Error", JSON.stringify(error?.response?.data || error.message));
} finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.replace("/(auth)/login")}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={24} color="#2d1e3f" />
      </TouchableOpacity>

      <View style={styles.formArea}>
        <View style={styles.iconBadge}>
          <Ionicons name="lock-open-outline" size={28} color="#2d1e3f" />
        </View>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter the token from your email and choose a new password
        </Text>

        <View style={styles.inputRow}>
          <Ionicons name="key-outline" size={18} color="#9e8b4e" />
          <TextInput
            placeholder="Enter token from email"
            placeholderTextColor="#c2b280"
            value={token}
            onChangeText={setToken}
            style={styles.input}
          />
        </View>

        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color="#9e8b4e" />
          <TextInput
            placeholder="Enter new password"
            placeholderTextColor="#c2b280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleReset}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.resetText}>Update Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          style={{ marginTop: 20 }}
        >
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.illustrationWrap} pointerEvents="none">
        <View style={styles.sun} />
        <View style={[styles.mountain, styles.mountainBack]} />
        <View style={[styles.mountain, styles.mountainFront]} />
        <Text style={styles.meditateEmoji}>🧘</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdf6ec",
    justifyContent: "space-between",
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingTop: 54,
  },
  formArea: {
    paddingHorizontal: 28,
    paddingTop: 16,
    alignItems: "center",
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f3e8c9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#2d1e3f",
    fontStyle: "italic",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 28,
    color: "#8a7f6a",
    fontSize: 13,
    paddingHorizontal: 12,
  },
  inputRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#eadfc4",
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    color: "#2d1e3f",
    paddingVertical: 14,
  },
  resetBtn: {
    width: "100%",
    backgroundColor: "#e0672c",
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 6,
    shadowColor: "#e0672c",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  resetText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  backText: {
    textAlign: "center",
    color: "#6b5b8a",
    fontWeight: "600",
    fontSize: 13,
  },
  illustrationWrap: {
    height: 150,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
  },
  sun: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f6c453",
    opacity: 0.85,
  },
  mountain: {
    position: "absolute",
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 160,
    borderRightWidth: 160,
    borderBottomWidth: 110,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    alignSelf: "center",
  },
  mountainBack: {
    borderBottomColor: "#6b5b8a",
    opacity: 0.55,
    left: -60,
  },
  mountainFront: {
    borderBottomColor: "#2d1e3f",
    left: 60,
  },
  meditateEmoji: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    fontSize: 30,
  },
});