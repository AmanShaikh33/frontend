
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#2d1e3f" }, 
        headerStyle: { backgroundColor: "#3c2a52" }, 
        headerTintColor: "#e0c878", 
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
