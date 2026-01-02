import axios from "axios";

// const api = axios.create({
//   baseURL:
//     process.env.NEXT_PUBLIC_API_URL ??
//     "https://hostle-management-backend.onrender.com/api",
//   timeout: 10000, // 🔥 increased for Neon cold start
//   withCredentials: false,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

const api = axios.create({
  baseURL: "https://hostle-management-backend.onrender.com/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});


console.log(process.env.NEXT_PUBLIC_API_URL);

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
  async (error) => {
    const config = error.config;

    // 🟡 Cold start / network issue → retry once
    if (!error.response && config && !config.__retry) {
      config.__retry = true;

      console.warn("Server waking up, retrying request...");
      await new Promise((r) => setTimeout(r, 3000));

      return api(config); // 🔁 retry original request
    }

    // 🔐 Token expired
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }

    return Promise.reject(error);
  }
);

export default api;
