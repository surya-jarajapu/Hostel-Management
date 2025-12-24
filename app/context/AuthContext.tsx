"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: any;
  loading: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Restore session on refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      setUser(JSON.parse(userStr));
    } else {
      setUser(null);
    }

    setLoading(false);
  }, []);

  // ✅ LOGIN
  const login = (token: string, userData: any) => {
    // Save to state
    setUser(userData);

    // Save to storage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    // 🔥 REQUIRED FOR MIDDLEWARE
    document.cookie = `token=${token}; path=/`;
  };

  // ✅ LOGOUT
  const logout = () => {
    setUser(null);
    localStorage.clear();

    // 🔥 Remove cookie
    document.cookie = "token=; Max-Age=0; path=/";

    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
