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
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>
        Login to continue your journey
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        placeholderTextColor="#9e8b4e"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        placeholderTextColor="#9e8b4e"
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        onPress={onLogin}
        style={styles.loginBtn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#e0c878" />
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/register")}
        style={styles.registerLink}
      >
        <Text style={styles.registerText}>
          New here?{" "}
          <Text style={styles.registerBold}>Register</Text>
        </Text>

      </TouchableOpacity>

      <TouchableOpacity
  onPress={() => router.push("/forgotPassword")}
  style={styles.forgotPasswordLink}
>
  <Text style={{ textAlign: "center", color: "#e0c878" }}>
    Forgot Password?
  </Text>
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
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#e0c878",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 40,
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

  loginBtn: {
    backgroundColor: "#3c2a52",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  loginText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e0c878",
  },

  registerLink: {
    marginTop: 24,
  },

  registerText: {
    textAlign: "center",
    color: "#e0c878",
  },

  registerBold: {
    fontWeight: "700",
    color: "#9e8b4e",
  },
  forgotPasswordLink: {
    marginTop: 16,
    justifyContent: "center",
  },
});
