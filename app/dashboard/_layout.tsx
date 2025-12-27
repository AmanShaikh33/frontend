import { Stack } from "expo-router";

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chatpage" options={{ title: "Chat Page" }} />
      <Stack.Screen name="freekundli" options={{ title: "Free Kundli" }} />
      <Stack.Screen name="matchkundli" options={{ title: "Match Kundli" }} />
      <Stack.Screen name="horoscope" options={{ title: "Horoscope" }} />
    </Stack>
  );
}
