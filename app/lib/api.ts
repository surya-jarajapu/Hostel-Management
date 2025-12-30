// import axios from "axios";

// const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL,
//   timeout: 10000,
// });

// if (!process.env.NEXT_PUBLIC_API_URL) {
//   throw new Error("NEXT_PUBLIC_API_URL is not defined");
// }

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     console.error("API Error:", error.response?.data || error.message);
//     return Promise.reject(error);
//   }
// );

// export default api;
// // lib/api.ts
// const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// if (!API_BASE) {
//   throw new Error("NEXT_PUBLIC_API_URL is not defined");
// }

// export async function apiRequest<T>(
//   path: string,
//   method: string = "GET",
//   body?: unknown
// ): Promise<T> {
//   const res = await fetch(`${API_BASE}${path}`, {
//     method,
//     headers: { "Content-Type": "application/json" },
//     body: body ? JSON.stringify(body) : undefined,
//   });

//   const data = await res.json();
//   if (!res.ok) {
//     throw new Error(data.message || "API request failed");
//   }

//   return data;
// }

import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ??
    "https://hostle-management-backend.onrender.com",
  timeout: 30000,
  withCredentials: false, // 👈 IMPORTANT
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Request interceptor → attach token
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

// 🚨 Response interceptor → global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";

    console.error("API Error:", message);

    // Optional: auto logout on 401
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      // window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
