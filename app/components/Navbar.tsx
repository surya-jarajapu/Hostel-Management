"use client";

import { useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  Users,
  BedDouble,
  LayoutDashboard,
  LogOut,
  UserCircle,
} from "lucide-react";

/* ================= TYPES ================= */

type NavBtnProps = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
};

/* ================= COMPONENT ================= */

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  /**
   * Close profile dropdown when clicking outside
   * (IMPORTANT: useCallback for ESLint + stability)
   */

  const handleOutsideClick = useCallback((e: MouseEvent) => {
    const target = e.target as Node | null;

    if (profileRef.current && target && !profileRef.current.contains(target)) {
      setProfileOpen(false);
    }
  }, []);

  /**
   * Attach / detach document click listener
   */
  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [handleOutsideClick]);

  /**
   * Wait until auth is resolved
   */
  if (loading || !user) return null;

  const masterName: string = user.name;
  const role: string = user.role;
  const hostelName: string = user.hostel?.name ?? "Hostel";

  return (
    <>
      {/* ================= TOP NAVBAR ================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-2">
        <div
          className="
            mx-auto max-w-7xl h-14
            flex items-center justify-between
            rounded-2xl
            bg-gradient-to-r from-[#0a84ff]/90 to-[#5ac8fa]/90
            backdrop-blur-xl
            border border-white/30
            shadow-md
          "
        >
          {/* LEFT */}
          <div
            onClick={() => router.push("/dashboard/admin")}
            className="
              px-6 flex items-center gap-3
              text-white font-semibold text-lg
              cursor-pointer truncate max-w-[240px]
            "
          >
            <LayoutDashboard size={22} />
            {hostelName}
          </div>

          {/* CENTER */}
          {role === "ADMIN" && (
            <div className="hidden md:flex items-center gap-3">
              <NavBtn
                icon={<Users size={18} />}
                label="Users"
                onClick={() => router.push("/master/admin/users")}
              />
              <NavBtn
                icon={<BedDouble size={18} />}
                label="Rooms"
                onClick={() => router.push("/master/admin/rooms")}
              />
            </div>
          )}

          {/* RIGHT PROFILE */}
          <div ref={profileRef} className="relative pr-5">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="
                w-9 h-9 rounded-full
                bg-white/25 backdrop-blur-md
                flex items-center justify-center
                text-white font-semibold
              "
            >
              {masterName?.[0]?.toUpperCase()}
            </button>

            {profileOpen && (
              <div
                className="
                  absolute right-0 mt-4 w-72
                  rounded-3xl
                  bg-white/20 backdrop-blur-2xl
                  border border-white/30
                  shadow-[0_30px_70px_rgba(0,0,0,0.45)]
                  overflow-hidden
                  text-white
                "
              >
                {/* PROFILE HEADER */}
                <div className="p-5 flex items-center gap-4 border-b border-white/20">
                  <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                    <UserCircle size={28} />
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold truncate">{masterName}</div>
                    <div className="text-sm text-white/70">{role}</div>
                  </div>
                </div>

                {/* LOGOUT */}
                <button
                  onClick={logout}
                  className="
                    w-full px-5 py-4
                    flex items-center gap-3
                    text-red-300 hover:text-red-200
                    hover:bg-red-500/20
                    transition
                  "
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      {role === "ADMIN" && (
        <div className="fixed bottom-3 left-0 right-0 z-40 md:hidden px-4">
          <div
            className="
              mx-auto max-w-md
              rounded-2xl
              bg-gradient-to-r from-[#0a84ff]/85 to-[#5ac8fa]/85
              backdrop-blur-xl
              border border-white/30
              shadow-md
            "
          >
            <div className="flex justify-around py-2 text-white">
              <TabButton
                icon={<LayoutDashboard size={22} />}
                label="Home"
                onClick={() => router.push("/dashboard/admin")}
              />
              <TabButton
                icon={<Users size={22} />}
                label="Users"
                onClick={() => router.push("/master/admin/users")}
              />
              <TabButton
                icon={<BedDouble size={22} />}
                label="Rooms"
                onClick={() => router.push("/master/admin/rooms")}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================= BUTTONS ================= */

function NavBtn({ icon, label, onClick }: NavBtnProps) {
  return (
    <button
      onClick={onClick}
      className="
        px-5 py-3 rounded-xl
        flex items-center gap-2
        text-sm font-medium
        text-white/90 hover:text-white
        hover:bg-white/15
        transition
      "
    >
      {icon}
      {label}
    </button>
  );
}

function TabButton({ icon, label, onClick }: NavBtnProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-xs font-medium"
    >
      {icon}
      {label}
    </button>
  );
}
