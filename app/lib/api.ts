import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ??
    "https://hostle-management-backend.onrender.com",
  timeout: 10000, // 🔥 increased for Neon cold start
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 Global response handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ⛔ Network / server down / cold start
    if (!error.response) {
      console.error("Network error or server waking up");
      return Promise.reject(error);
    }

    const status = error.response.status;
    const message =
      error.response.data?.message ||
      error.message ||
      "Something went wrong";

    console.error(`API Error ${status}:`, message);

    // 🔐 Token expired / invalid
    if (status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login"; // ✅ MUST redirect
    }

    return Promise.reject(error);
  }
);

export default api;
