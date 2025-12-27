import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#e0c878",
        tabBarInactiveTintColor: "#9e8b4e", 
        tabBarStyle: {
          backgroundColor: "#2d1e3f", 
          position: "absolute",
          marginHorizontal: 20,
          marginBottom: Platform.OS === "ios" ? 30 : 30,
          borderRadius: 20,
          height: 60,
          paddingBottom: 5,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
          elevation: 5,
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="astroform"
        options={{
          title: "astroform",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
