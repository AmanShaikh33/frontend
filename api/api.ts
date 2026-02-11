import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";



const API_URL = "http://10.88.89.72:5000/api"; // For network development
// const API_URL = "http://localhost:5000/api"; // For local development
// const API_URL = "https://astro-backend-qdu5.onrender.com/api"; // Render deployment

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ No token found in AsyncStorage!");
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.message === "Not authorized, token failed") {
      await AsyncStorage.removeItem("token");
      // Token is invalid, user will be redirected to login by app logic
    }
    return Promise.reject(error);
  }
);


export const setAuthToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};


interface ApiError {
  message: string;
  [key: string]: any;
}

/* ------------------- AUTH ------------------- */

export const apiRegister = async (data: any) => {
  try {
    const res = await api.post("/auth/register", data);
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Registration failed" };
  }
};

export const apiLogin = async (data: any) => {
  try {
    console.log("📡 API Login Request:", {
      url: `${API_URL}/auth/login`,
      data
    });
    
    const res = await api.post("/auth/login", data);
    return res.data; // { token: string, user: {...} }
  } catch (error: any) {
    console.log("🚨 API Login Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error.response?.data || error;
  }
};

export const apiGetMe = async (token: string) => {
  try {
    const res = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // returns user object
  } catch (error: any) {
    throw error.response?.data || { message: "Fetching user failed" };
  }
};


export const apiCreateProfile = async (token: string, formData: FormData) => {
  try {
    const res = await api.post("/astrologers/profile", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Create profile failed" };
  }
};

// Get my profile
export const apiGetMyProfile = async (token: string) => {
  try {
    const res = await api.get("/astrologers/my-profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Get my profile failed" };
  }
};

// Update profile
export const apiUpdateProfile = async (token: string, formData: FormData) => {
  try {
    const res = await api.put("/astrologers/profile", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Update profile failed" };
  }
};

// Delete profile
export const apiDeleteProfile = async (token: string) => {
  try {
    const res = await api.delete("/astrologers/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Delete profile failed" };
  }
};

// Update availability
export const apiUpdateAvailability = async (token: string, availability: "online" | "offline") => {
  try {
    const res = await api.put(
      "/astrologers/status",
      { availability },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Update availability failed" };
  }
};

// Get all astrologers with optional filters
export const apiGetAllAstrologers = async (token: string, filters?: {
  skills?: string;
  languages?: string;
  priceMin?: number;
  priceMax?: number;
  availability?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const res = await api.get("/astrologers", {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
    });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Get all astrologers failed" };
  }
};

export const apiGetPendingAstrologers = async (token: string) => {
  try {
    const res = await api.get("/admin/astrologers/pending", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Get pending astrologers failed" };
  }
};

// Approve astrologer
export const apiApproveAstrologer = async (token: string, id: string) => {
  try {
    const res = await api.put(`/admin/astrologers/approve/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // { message, astrologer }
  } catch (error: any) {
    throw error.response?.data || { message: "Approve astrologer failed" };
  }
};

// Reject astrologer (delete)
export const apiRejectAstrologer = async (token: string, id: string) => {
  try {
    const res = await api.delete(`/admin/astrologers/reject/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // { message }
  } catch (error: any) {
    throw error.response?.data || { message: "Reject astrologer failed" };
  }
};

// Get astrologers with filter (approved/pending)
export const apiGetAstrologersWithFilter = async (token: string, status?: "pending" | "approved") => {
  try {
    const res = await api.get("/admin/astrologers", {
      headers: { Authorization: `Bearer ${token}` },
      params: { status },
    });
    return res.data; // { success, count, astrologers }
  } catch (error: any) {
    throw error.response?.data || { message: "Get astrologers with filter failed" };
  }
};

// Get only approved astrologers (public endpoint for users)
export const apiGetApprovedAstrologers = async () => {
  try {
    const res = await api.get("/astrologers/approved"); // no token header
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Get approved astrologers failed" };
  }
};

export const apiAdminDeleteAstrologer = async (token: string, id: string) => {
  try {
    const res = await api.delete(`/astrologers/admin/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Delete astrologer failed" };
  }
};

/* ------------------- USER APIs ------------------- */

// Get user by ID
export const apiGetUserById = async (token: string, userId: string) => {
  try {
    const res = await api.get(`/auth/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Get user failed" };
  }
};

// Get astrologer by ID
export const apiGetAstrologerById = async (token: string, astrologerId: string) => {
  try {
    const res = await api.get(`/astrologers/${astrologerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Get astrologer failed" };
  }
};

/* ------------------- CHAT APIs ------------------- */



export const apiCreateOrGetChatRoom = async (token, astrologerId = null, userId = null) => {
  const body = astrologerId ? { astrologerId } : { userId };

  const response = await fetch("http://10.88.89.72:5000/api/chat/create-room", {
  // const response = await fetch("http://localhost:5000/api/chat/create-room", {
  // const response = await fetch("https://astro-backend-qdu5.onrender.com/api/chat/create-room", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to create/get chat room");
  }

  return await response.json();
};


export const apiGetMessages = async (token: string, chatRoomId: string) => {
  const res = await api.get(`/chat/messages/${chatRoomId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const apiSendMessage = async (
  token: string,
  chatRoomId: string,
  receiverId: string,
  content: string
) => {
  const res = await api.post(
    "/chat/send",
    { chatRoomId, receiverId, content },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

export const apiGetUserChats = async (token: string) => {
  const res = await api.get("/chat/my-chats", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

/* ------------------- WALLET / PAYMENT APIs ------------------- */

// Create Razorpay Order
export const apiCreateOrder = async (amount: number) => {
  try {
    const res = await api.post("/payments/create-order", { amount });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Order creation failed" };
  }
};

// Verify Payment & Add Coins
export const apiVerifyPayment = async (data: any) => {
  try {
    const res = await api.post("/payments/verify", data);
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Payment verification failed" };
  }
};

// Get Wallet Balance
export const apiGetWalletBalance = async (userId: string) => {
  try {
    const res = await api.get(`/payments/balance/${userId}`);
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch wallet balance" };
  }
};

// Get Astrologer Earnings
export const apiGetAstrologerEarnings = async (token: string) => {
  try {
    const res = await api.get("/astrologers/earnings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch earnings" };
  }
};


export const apiAcceptChat = async (
  token: string,
  requestId: string
) => {
  const res = await api.post(
    "/chat/accept",
    { requestId },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return res.data; 
  // { message, sessionId }
};
export const apiEndChat = async (
  token: string,
  sessionId: string
) => {
  const res = await api.post(
    "/chat/end",
    { sessionId },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return res.data;
};

export const apiAcceptChatRequest = async (token, requestId) => {
  const res = await fetch(
    "http://10.88.89.72:5000/api/chat/accept",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requestId }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }

  return res.json();
};



export default api;
