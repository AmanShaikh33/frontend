import { Stack } from "expo-router";
import { useEffect } from "react";
import { socket } from "../lib/socket";

export default function Layout() {
  useEffect(() => {
    console.log("🔌 RootLayout mounted → connecting socket");

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      console.log("🔌 RootLayout unmounted → disconnecting socket");
      socket.disconnect();
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
