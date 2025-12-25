import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // ✅ backend base URL
  timeout: 5000,
});

// Optional: attach interceptors (for auth, logs, errors, etc.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
// lib/api.ts
export async function apiRequest<T>(
  url: string,
  method: string = "GET",
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}
