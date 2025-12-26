"use client";

import { useEffect, useState, ReactNode } from "react";
import {
  Users,
  BedDouble,
  IndianRupee,
  CircleDollarSign,
  AlarmClock,
  NotepadTextDashedIcon,
} from "lucide-react";

/* ================= TYPES ================= */

/** Room reference used inside user rows */
type RoomRef = {
  room_number: string;
  floor_number: string;
};

/** Users shown in PARTIAL / OVERDUE / PENDING */
type UserRow = {
  user_id: string;
  user_name: string;
  mobile: string;
  due_amount: number;
  delay_days: number;
  room?: RoomRef;
};

/** Rows shown in BEDS modal */
type BedRow = {
  room_id: string;
  room_number: string;
  available_beds: number;
};

/** Dashboard counters */
type DashboardStats = {
  total_users: number;
  partial_users: number;
  overdue_users: number;
  available_beds: number;
  collected_this_month: number;
  pending_list: number;
};

type ModalType = "PARTIAL" | "OVERDUE" | "BEDS" | "PENDING" | null;

/* ================= PAGE ================= */

export default function AdminDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<ModalType>(null);

  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    partial_users: 0,
    overdue_users: 0,
    available_beds: 0,
    collected_this_month: 0,
    pending_list: 0,
  });

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        setStats(json.data);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return <div className="pt-[104px] p-6">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-[104px] px-4 sm:px-6 pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Overview of hostel activity</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon={<Users />}
          gradient="from-blue-600 to-cyan-400"
        />

        <StatCard
          title="Partial Users"
          value={stats.partial_users}
          icon={<CircleDollarSign />}
          gradient="from-yellow-500 to-orange-400"
          onClick={() => setModalType("PARTIAL")}
        />

        <StatCard
          title="Overdue Users"
          value={stats.overdue_users}
          icon={<AlarmClock />}
          gradient="from-red-500 to-pink-500"
          onClick={() => setModalType("OVERDUE")}
        />

        <StatCard
          title="Beds Available"
          value={stats.available_beds}
          icon={<BedDouble />}
          gradient="from-emerald-500 to-teal-400"
          onClick={() => setModalType("BEDS")}
        />

        <StatCard
          title="Collected This Month"
          value={`₹ ${stats.collected_this_month}`}
          icon={<IndianRupee />}
          gradient="from-purple-500 to-indigo-500"
        />

        <StatCard
          title="Pending List"
          value={stats.pending_list}
          icon={<NotepadTextDashedIcon />}
          gradient="from-purple-500 to-indigo-500"
          onClick={() => setModalType("PENDING")}
        />
      </div>

      {modalType && (
        <DashboardModal
          type={modalType}
          onClose={() => setModalType(null)}
        />
      )}
    </div>
  );
}

/* ================= STAT CARD ================= */

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  gradient: string;
  onClick?: () => void;
};

function StatCard({
  title,
  value,
  icon,
  gradient,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-3xl text-white
        bg-gradient-to-br ${gradient}
        border border-white/30
        shadow-[0_20px_45px_rgba(0,0,0,0.35)]
        p-5
        ${onClick ? "cursor-pointer hover:scale-[1.03] transition" : ""}
      `}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-white/80">{title}</span>
        <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}

/* ================= MODAL ================= */

function DashboardModal({
  type,
  onClose,
}: {
  type: ModalType;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [beds, setBeds] = useState<BedRow[]>([]);

  useEffect(() => {
    const endpoint =
      type === "BEDS"
        ? "/admin/dashboard/available-beds"
        : type === "OVERDUE"
        ? "/admin/dashboard/overdue-users"
        : type === "PARTIAL"
        ? "/admin/dashboard/partial-users"
        : "/admin/dashboard/pending-collections";

    fetch(`http://localhost:3000${endpoint}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (type === "BEDS") {
          setBeds(json.data ?? []);
        } else {
          setUsers(json.data ?? []);
        }
      });
  }, [type]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white/20 border border-white/30 text-white overflow-hidden">
        <div className="p-5 flex justify-between border-b border-white/20">
          <h3 className="font-semibold text-lg">{type} LIST</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="p-5 space-y-3">
          {type === "BEDS"
            ? beds.map((r) => (
                <div
                  key={r.room_id}
                  className="rounded-xl bg-white/20 p-3"
                >
                  Room {r.room_number} — Available beds:{" "}
                  {r.available_beds}
                </div>
              ))
            : users.map((u) => (
                <div
                  key={u.user_id}
                  className="rounded-xl bg-white/20 p-3"
                >
                  <div className="font-medium">{u.user_name}</div>
                  <div className="text-sm text-white/70">
                    Room {u.room?.room_number} · Floor{" "}
                    {u.room?.floor_number}
                  </div>
                  <div className="text-yellow-200">
                    Due ₹ {u.due_amount}
                  </div>
                  {type === "OVERDUE" && (
                    <div className="text-red-300">
                      Delay: {u.delay_days} days
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
