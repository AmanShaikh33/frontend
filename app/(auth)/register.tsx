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
import { Ionicons } from "@expo/vector-icons";
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#2d1e3f" />
        </TouchableOpacity>

        <Text style={styles.welcomeLabel}>Welcome to</Text>
        <Text style={styles.title}>AstroConnect</Text>
        <Text style={styles.subtitle}>Sign up to get started with your journey</Text>

        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={18} color="#9e8b4e" />
          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#c2b280"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>

        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={18} color="#9e8b4e" />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#c2b280"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
        </View>

        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color="#9e8b4e" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#c2b280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color="#9e8b4e" />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#c2b280"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />
        </View>

        {/* Role selection */}
        <View style={styles.roleRow}>
          <TouchableOpacity
            onPress={() => setRole("user")}
            style={[styles.roleBtn, role === "user" && styles.roleBtnActive]}
          >
            <Text style={[styles.roleText, role === "user" && styles.roleTextActive]}>
              User
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRole("astrologer")}
            style={[styles.roleBtn, role === "astrologer" && styles.roleBtnActive]}
          >
            <Text style={[styles.roleText, role === "astrologer" && styles.roleTextActive]}>
              Astrologer
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.registerBtnText}>
            {loading ? "Registering..." : "Register"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.loginLink}>
            Already have an account? <Text style={styles.loginBold}>Login</Text>
          </Text>
        </TouchableOpacity>

        {/* Decorative footer illustration */}
        <View style={styles.illustrationWrap} pointerEvents="none">
          <View style={styles.sun} />
          <View style={[styles.mountain, styles.mountainBack]} />
          <View style={[styles.mountain, styles.mountainFront]} />
          <Text style={styles.meditateEmoji}>🧘</Text>
        </View>

        <Text style={styles.termsText}>
          By continuing, you agree to our{" "}
          <Text style={styles.termsLink}>Terms & Conditions</Text> and{" "}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdf6ec",
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 24,
  },

  backBtn: {
    paddingTop: 54,
    paddingBottom: 8,
  },

  welcomeLabel: {
    textAlign: "center",
    fontSize: 15,
    color: "#6b5b8a",
    marginBottom: 2,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#2d1e3f",
    fontStyle: "italic",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 24,
    color: "#8a7f6a",
    fontSize: 13,
  },

  inputRow: {
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

  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },

  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfc4",
  },

  roleBtnActive: {
    backgroundColor: "#2d1e3f",
    borderColor: "#2d1e3f",
  },

  roleText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#8a7f6a",
  },

  roleTextActive: {
    color: "#e0c878",
  },

  registerBtn: {
    backgroundColor: "#e0672c",
    paddingVertical: 15,
    borderRadius: 28,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#e0672c",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  registerBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },

  loginLink: {
    textAlign: "center",
    color: "#6b5b8a",
    fontSize: 13,
  },

  loginBold: {
    fontWeight: "700",
    color: "#e0672c",
  },

  illustrationWrap: {
    height: 140,
    marginTop: 28,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
  },
  sun: {
    position: "absolute",
    bottom: 26,
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f6c453",
    opacity: 0.85,
  },
  mountain: {
    position: "absolute",
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 150,
    borderRightWidth: 150,
    borderBottomWidth: 100,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    alignSelf: "center",
  },
  mountainBack: {
    borderBottomColor: "#6b5b8a",
    opacity: 0.55,
    left: -55,
  },
  mountainFront: {
    borderBottomColor: "#2d1e3f",
    left: 55,
  },
  meditateEmoji: {
    position: "absolute",
    bottom: 6,
    alignSelf: "center",
    fontSize: 28,
  },

  termsText: {
    textAlign: "center",
    fontSize: 10,
    color: "#a89f8c",
    paddingHorizontal: 12,
    marginTop: 6,
  },
  termsLink: {
    color: "#6b5b8a",
    textDecorationLine: "underline",
  },
});