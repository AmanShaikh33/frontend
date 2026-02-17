import { io } from "socket.io-client";

const SOCKET_URL = "http://10.73.18.71:5000";
// const SOCKET_URL = "http://localhost:5000";
// const SOCKET_URL = "https://astro-backend-qdu5.onrender.com";

export const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  autoConnect: false,
});


socket.on("connect", () => {
  console.log("🟢 Socket connected to:", SOCKET_URL);
});

socket.on("disconnect", () => {
  console.log("🔴 Socket disconnected");
});

socket.on("connect_error", (error) => {
  console.log("❌ Socket connection error:", error);
});
