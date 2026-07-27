import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiLogin } from "../../api/api";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("userData");

      if (token && userStr) {
        const user = JSON.parse(userStr);

        if (user.role === "admin") router.replace("/admindashboard/home");
        else if (user.role === "user") router.replace("/dashboard/home");
        else if (user.role === "astrologer")
          router.replace("/astrologerdashboard/home");
        else router.replace("/dashboard/home");
      }
    };

    checkLoggedIn();
  }, []);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const loginRes = await apiLogin({ email, password });

      const token = loginRes.token;
      const user = loginRes.user || loginRes;

      if (!token) throw new Error("No token returned from login");
      if (!user || !(user._id || user.id))
        throw new Error("Invalid user data returned from backend");

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("userData", JSON.stringify(user));
      await AsyncStorage.setItem("userType", user.role || "user");

      if (user.role === "admin") router.replace("/admindashboard/home");
      else if (user.role === "user") router.replace("/dashboard/home");
      else if (user.role === "astrologer")
        router.replace("/astrologerdashboard/home");
      else router.replace("/dashboard/home");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={24} color="#2d1e3f" />
      </TouchableOpacity>

      <View style={styles.formArea}>
        <Text style={styles.welcomeLabel}>Welcome to</Text>
        <Text style={styles.title}>AstroConnect</Text>
        <Text style={styles.subtitle}>Login to continue your journey</Text>

        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={18} color="#9e8b4e" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#c2b280"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color="#9e8b4e" />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#c2b280"
            secureTextEntry
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          onPress={onLogin}
          style={styles.loginBtn}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loginText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/register")}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>
            New here? <Text style={styles.registerBold}>Register</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/forgotPassword")}
          style={styles.forgotPasswordLink}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

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
    paddingTop: 12,
  },

  welcomeLabel: {
    textAlign: "center",
    fontSize: 15,
    color: "#6b5b8a",
    marginBottom: 2,
  },

  title: {
    fontSize: 30,
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

  loginBtn: {
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

  loginText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e8ddc4" },
  dividerText: { color: "#a89f8c", fontSize: 12 },

  registerLink: {
    marginTop: 8,
  },

  registerText: {
    textAlign: "center",
    color: "#6b5b8a",
    fontSize: 13,
  },

  registerBold: {
    fontWeight: "700",
    color: "#e0672c",
  },

  forgotPasswordLink: {
    marginTop: 12,
    justifyContent: "center",
  },

  forgotText: {
    textAlign: "center",
    color: "#a3915a",
    fontSize: 12,
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

  termsText: {
    textAlign: "center",
    fontSize: 10,
    color: "#a89f8c",
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  termsLink: {
    color: "#6b5b8a",
    textDecorationLine: "underline",
  },
});