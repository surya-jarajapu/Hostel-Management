"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  type LoginErrorResponse = {
    message?: string;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });

      const { token, masterUser } = res.data.data;

      login(token, masterUser);

      // ✅ SUCCESS TOAST
      toast.success("Login successful");

      if (masterUser.role === "ADMIN") {
        router.replace("/dashboard/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      const error = err as AxiosError;

      if (error.code === "ECONNABORTED") {
        toast.error("Server is waking up. Please try again in 5 seconds.");
        return;
      }

      if (error.response?.status === 401) {
        toast.error("Invalid credentials");
        return;
      }

      toast.error("Server error. Try again shortly.");
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* ===== Background Image ===== */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/hostel-bg.jpg')",
        }}
      />

      {/* ===== Dark Overlay ===== */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* ===== Content ===== */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div
          className="
            w-full
            max-w-md sm:max-w-lg lg:max-w-xl
            rounded-[32px]
            bg-gradient-to-br from-[#0a84ff]/80 to-[#5ac8fa]/80
            backdrop-blur-2xl
            border border-white/30
            shadow-[0_30px_80px_rgba(0,0,0,0.45)]
            p-6 sm:p-8 lg:p-10
          "
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl lg:text-3xl font-semibold text-white">
              Hostel Management
            </h1>
            <p className="text-white/80 text-sm lg:text-base mt-2">
              Secure login to manage users & rooms
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
            {/* Email */}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full px-4 lg:px-5 py-3 lg:py-4
                rounded-xl
                bg-white/20 backdrop-blur-md
                border border-white/30
                text-white placeholder-white/70
                focus:outline-none focus:ring-2 focus:ring-white/40
              "
            />

            {/* Password */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full px-4 lg:px-5 py-3 lg:py-4
                rounded-xl
                bg-white/20 backdrop-blur-md
                border border-white/30
                text-white placeholder-white/70
                focus:outline-none focus:ring-2 focus:ring-white/40
              "
            />

            {/* Error */}
            {error && (
              <div className="text-center text-sm text-red-200">{error}</div>
            )}

            {/* Button */}
            <button
              type="submit"
              className="
                w-full py-3 lg:py-4
                rounded-xl
                bg-white text-[#0a84ff]
                font-semibold text-base
                shadow-[0_12px_35px_rgba(255,255,255,0.35)]
                hover:bg-white/90
                active:scale-[0.97]
                transition
              "
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
