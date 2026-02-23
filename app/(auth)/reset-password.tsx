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
      <Text style={styles.title}>Reset Password</Text>

      <TextInput
        placeholder="Enter token from email"
        placeholderTextColor="#9e8b4e"
        value={token}
        onChangeText={setToken}
        style={styles.input}
      />

      <TextInput
        placeholder="Enter new password"
        placeholderTextColor="#9e8b4e"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.resetBtn}
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#e0c878" />
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#2d1e3f",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 32,
    color: "#e0c878",
  },
  input: {
    borderWidth: 1,
    borderColor: "#9e8b4e",
    backgroundColor: "#604f70",
    color: "#e0c878",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  resetBtn: {
    backgroundColor: "#3c2a52",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  resetText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e0c878",
  },
  backText: {
    textAlign: "center",
    color: "#9e8b4e",
    fontWeight: "600",
  },
});
