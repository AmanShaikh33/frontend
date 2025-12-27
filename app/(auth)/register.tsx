import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { apiRegister } from "../../api/api";

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await apiRegister({ name, email, password, role });
      Alert.alert("Success", "Registration successful!");
      router.push("/login");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Sign up to get started with your journey
        </Text>

        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#9e8b4e"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#9e8b4e"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#9e8b4e"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#9e8b4e"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
        />

        {/* Role selection */}
        <View style={styles.roleRow}>
          <TouchableOpacity
            onPress={() => setRole("user")}
            style={[
              styles.roleBtn,
              role === "user" && styles.roleBtnActive,
            ]}
          >
            <Text style={styles.roleText}>User</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRole("astrologer")}
            style={[
              styles.roleBtn,
              role === "astrologer" && styles.roleBtnActive,
            ]}
          >
            <Text style={styles.roleText}>Astrologer</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerText}>
            {loading ? "Registering..." : "Register"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.loginLink}>
            Already have an account?{" "}
            <Text style={styles.loginBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2d1e3f",
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#e0c878",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    color: "#9e8b4e",
  },

  input: {
    borderWidth: 1,
    borderColor: "#9e8b4e",
    backgroundColor: "#604f70",
    color: "#e0c878",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },

  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#604f70",
    marginHorizontal: 4,
  },

  roleBtnActive: {
    backgroundColor: "#3c2a52",
  },

  roleText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#e0c878",
  },

  registerBtn: {
    backgroundColor: "#3c2a52",
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: "center",
  },

  registerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e0c878",
  },

  loginLink: {
    textAlign: "center",
    color: "#e0c878",
  },

  loginBold: {
    fontWeight: "700",
    color: "#9e8b4e",
  },
});
