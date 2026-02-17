import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import astroappimg from "../assets/images/astroappimg.png";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  /* ------------------ AUTH CHECK ------------------ */
  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("userData");

      if (token && userStr) {
        const user = JSON.parse(userStr);

        if (user.role === "admin")
          router.replace("/admindashboard/home");
        else if (user.role === "user")
          router.replace("/dashboard/home");
        else if (user.role === "astrologer")
          router.replace("/astrologerdashboard/home");
        else router.replace("/(auth)/login");
      } else {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);


  const imageScale = useRef(new Animated.Value(0.95)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(imageScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(imageScale, {
          toValue: 0.95,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);


  const buttonScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
    
      <View style={[styles.star, styles.star1]} />
      <View style={[styles.star, styles.star2]} />
      <View style={[styles.star, styles.star3]} />
      <View style={[styles.star, styles.star4]} />

    
      <Animated.Image
        source={astroappimg}
        style={[styles.image, { transform: [{ scale: imageScale }] }]}
        resizeMode="cover"
      />

      <Text style={styles.title}>Welcome</Text>

      <Text style={styles.subtitle}>
        Explore the mystical world of astrology with personalized guidance
      </Text>

   
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.8}
          style={styles.startBtn}
        >
          <Text style={styles.startText}>Start Now</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#2d1e3f",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#2d1e3f",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  image: {
    width: 300,
    height: 400,
    borderRadius: 16,
    marginBottom: 32,
  },

  title: {
    color: "#e0c878",
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 16,
  },

  startBtn: {
    paddingVertical: 16,
    paddingHorizontal: 56,
    borderRadius: 999,
    backgroundColor: "#2d1e3f",
    borderWidth: 2,
    borderColor: "#e0c878",
    shadowColor: "#e0c878",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },

  startText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  star: {
    position: "absolute",
    backgroundColor: "#e0c878",
    borderRadius: 50,
  },

  star1: {
    width: 8,
    height: 8,
    top: 40,
    left: 20,
  },

  star2: {
    width: 12,
    height: 12,
    top: 80,
    right: 40,
  },

  star3: {
    width: 8,
    height: 8,
    bottom: 120,
    left: 64,
  },

  star4: {
    width: 12,
    height: 12,
    bottom: 96,
    right: 80,
  },
});
