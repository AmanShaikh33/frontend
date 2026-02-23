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
import { apiForgotPassword } from "../../api/api";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    try {
      setLoading(true);

      await apiForgotPassword(email.trim());

      Alert.alert(
        "Reset Link Sent",
        "If this email exists, a reset link has been sent."
      );

      router.replace("/(auth)/login");

    }  catch (error: any) {
  console.log("FORGOT ERROR:", error);
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
      <Text style={styles.title}>Forgot Password</Text>

      <TextInput
        placeholder="Enter your email"
        placeholderTextColor="#9e8b4e"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
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
          <Text style={styles.resetText}>Reset Password</Text>
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
