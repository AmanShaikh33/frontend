import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#e0672c",
        tabBarInactiveTintColor: "#a89f8c",
        tabBarStyle: {
          backgroundColor: "#fff",
          position: "absolute",
          marginHorizontal: 20,
          marginBottom: Platform.OS === "ios" ? 30 : 30,
          borderRadius: 24,
          height: 64,
          paddingBottom: 6,
          paddingTop: 6,
          borderWidth: 1,
          borderColor: "#f0ebe0",
          shadowColor: "#2d1e3f",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 14,
          elevation: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        headerStyle: { backgroundColor: "#2d1e3f" },
        headerTitleStyle: { color: "#e0c878", fontWeight: "bold" },
        headerTintColor: "#e0c878",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={color} />
          ),
        }}
      />
      
    </Tabs>
  );
}