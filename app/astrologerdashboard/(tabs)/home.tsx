import React, { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator, TouchableOpacity, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { apiUpdateAvailability, apiGetAstrologerEarnings, apiGetMyProfile } from "../../../api/api";
import { socket } from "../../../lib/socket";

const UserHome = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<"online" | "offline">("offline");
  const [updating, setUpdating] = useState(false);
  const [earnings, setEarnings] = useState<number>(0);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [astrologerDocId, setAstrologerDocId] = useState("");
  const [chatRequest, setChatRequest] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem("userData");
        const token = await AsyncStorage.getItem("token");

        if (!userStr || !token) {
          router.replace("/login");
          return;
        }

        const parsedUser = JSON.parse(userStr);

        if (parsedUser.role !== "astrologer") {
          router.replace("/login"); 
          return;
        }

        setUser(parsedUser);
       
        if (parsedUser.availability) setAvailability(parsedUser.availability);
        
        // Load earnings and astrologer profile
        await loadEarnings(token);
        
        // Get astrologer document ID
        const astroProfile = await apiGetMyProfile(token);
        setAstrologerDocId(astroProfile._id);
        
        // Setup socket connection for chat requests
        const decoded: any = jwtDecode(token);
        console.log("🔌 Connecting astrologer to socket with ID:", decoded.id);
        
        if (!socket.connected) {
          socket.connect();
        }
        
        socket.emit("astrologerOnline", { astrologerId: decoded.id });
        
        // Listen for incoming chat requests
        socket.on("incomingChatRequest", ({ userId, userName, roomId, requestId }) => {
          console.log("🔔 Received chat request from:", userName, "requestId:", requestId);
          setChatRequest({ userId, userName, roomId, requestId });
          setShowModal(true);
          
          // Add alert sound/vibration
          Alert.alert(
            "New Chat Request!",
            `${userName} wants to chat with you`,
            [
              { text: "Reject", onPress: () => setShowModal(false), style: "cancel" },
              { text: "Accept", onPress: () => {
                setShowModal(false);
                router.push(`/astrologerdashboard/chatpage?userId=${userId}&requestId=${requestId}`);
              }}
            ]
          );
        });

        // Listen for minute-billed event to update earnings in real-time
        socket.on("minute-billed", ({ astrologerEarnings }) => {
          console.log("💰 [ASTROLOGER HOME] Earnings updated:", astrologerEarnings);
          setEarnings(astrologerEarnings);
        });
        
      } catch (err) {
        console.error(err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    
    return () => {
      socket.off("incomingChatRequest");
      socket.off("minute-billed");
    };
  }, []);

  const loadEarnings = async (token: string) => {
    setLoadingEarnings(true);
    try {
      const response = await apiGetAstrologerEarnings(token);
      setEarnings(response.earnings || 0);
    } catch (error: any) {
      console.error("Failed to load earnings:", error);
    } finally {
      setLoadingEarnings(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("userData");
    await AsyncStorage.removeItem("userType");
    router.replace("/login");
  };

  const handleAcceptChat = () => {
    setShowModal(false);
    router.push(`/astrologerdashboard/chatpage?userId=${chatRequest.userId}&requestId=${chatRequest.requestId}`);
  };

  const handleRejectChat = () => {
    setShowModal(false);
    setChatRequest(null);
  };

  const toggleAvailability = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const newStatus = availability === "online" ? "offline" : "online";
      await apiUpdateAvailability(token, newStatus);
      setAvailability(newStatus);

      // Update socket connection based on availability
      if (newStatus === "online" && user) {
        const decoded: any = jwtDecode(token);
        socket.emit("astrologerOnline", { astrologerId: decoded.id }); // Use user ID
      }

      // Optionally update AsyncStorage userData
      const updatedUser = { ...user, availability: newStatus };
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#2d1e3f]">
        <ActivityIndicator size="large" color="#e0c878" />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-[#2d1e3f] px-6">
      <Text className="text-2xl font-bold text-[#e0c878] mb-6">
        Welcome, {user?.name || "User"}
      </Text>

      {/* Earnings Display */}
      <View className="bg-[#3c2a52] p-6 rounded-lg mb-6 w-full max-w-sm">
        <Text className="text-lg font-semibold text-[#e0c878] text-center mb-2">
          Total Earnings
        </Text>
        {loadingEarnings ? (
          <ActivityIndicator size="small" color="#e0c878" />
        ) : (
          <Text className="text-3xl font-bold text-white text-center">
            ₹{earnings.toFixed(2)}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={toggleAvailability}
        className={`py-3 px-6 rounded-lg mb-6 ${
          availability === "online" ? "bg-green-500" : "bg-red-500"
        }`}
        disabled={updating}
      >
        <Text className="text-white font-bold text-lg">
          {updating ? "Updating..." : availability === "online" ? "Go Offline" : "Go Online"}
        </Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <Button title="Logout" onPress={handleLogout} color="#3c2a52" />
      
      {/* Chat Request Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-6 mx-6 w-80">
            <Text className="text-xl font-bold text-center mb-4 text-gray-800">
              💬 Chat Request
            </Text>
            <Text className="text-center mb-6 text-gray-600">
              {chatRequest?.userName} wants to chat with you
            </Text>
            <View className="flex-row justify-around">
              <TouchableOpacity
                onPress={handleRejectChat}
                className="bg-red-500 px-6 py-3 rounded-lg flex-1 mr-2"
              >
                <Text className="text-white font-bold text-center">Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAcceptChat}
                className="bg-green-500 px-6 py-3 rounded-lg flex-1 ml-2"
              >
                <Text className="text-white font-bold text-center">Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default UserHome;
