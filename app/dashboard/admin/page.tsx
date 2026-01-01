"use client";

import { useEffect, useState, ReactNode, useRef } from "react";
import {
  Users,
  BedDouble,
  IndianRupee,
  CircleDollarSign,
  AlarmClock,
  NotepadTextDashedIcon,
} from "lucide-react";
import api from "@/app/lib/api";

/* ================= TYPES ================= */

type RoomRef = {
  room_number: string;
  floor_number: string;
};

type UserRow = {
  user_id: string;
  user_name: string;
  due_amount: number;
  delay_days: number;
  room?: RoomRef;
};

type BedRow = {
  room_id: string;
  room_number: string;
  available_beds: number;
};

type DashboardStats = {
  total_users: number;
  partial_users: number;
  overdue_users: number;
  available_beds: number;
  collected_this_month: number;
  pending_list: number;
};

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  gradient: string;
  onClick?: () => void;
};


type ModalType = "PARTIAL" | "OVERDUE" | "BEDS" | "PENDING" | null;

/* ================= PAGE ================= */

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [loaded, setLoaded] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    partial_users: 0,
    overdue_users: 0,
    available_beds: 0,
    collected_this_month: 0,
    pending_list: 0,
  });



 useEffect(() => {
  if (loaded) return;

  api.get("/admin/dashboard")
    .then((res) => {
      setStats(res.data.data);
      setLoaded(true);
    })
    .catch(() => {
      // fail-safe to prevent crash
      setStats({
        total_users: 0,
        partial_users: 0,
        overdue_users: 0,
        available_beds: 0,
        collected_this_month: 0,
        pending_list: 0,
      });
    })
    .finally(() => {
      setLoading(false);
    });
}, [loaded]);


  return (
    <div className="min-h-screen bg-gray-100 pt-16 px-4 sm:px-6">
      {/* HEADER */}
      <div className="mb-1">
        <h1 className="text-lg font-semibold text-gray-900">
          Admin Dashboard
        </h1>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
<StatCard
  title="Total Users"
  value={loading ? "—" : stats?.total_users ?? 0}
  icon={<Users size={18} />}
  gradient="from-blue-600 to-cyan-400"
/>

<StatCard
  title="Partial Users"
  value={loading ? "—" : stats.partial_users}
  icon={<CircleDollarSign size={18} />}
  gradient="from-yellow-500 to-orange-400"
  onClick={() => setModalType("PARTIAL")}
/>

<StatCard
  title="Overdue Users"
  value={loading ? "—" : stats.overdue_users}
  icon={<AlarmClock size={18} />}
  gradient="from-red-500 to-pink-500"
  onClick={() => setModalType("OVERDUE")}
/>

<StatCard
  title="Beds Available"
  value={loading ? "—" : stats.available_beds}
  icon={<BedDouble size={18} />}
  gradient="from-emerald-500 to-teal-400"
  onClick={() => setModalType("BEDS")}
/>

<StatCard
  title="Collected This Month"
  value={loading ? "—" : `₹ ${stats.collected_this_month}`}
  icon={<IndianRupee size={18} />}
  gradient="from-purple-500 to-indigo-500"
/>

<StatCard
  title="Pending List"
  value={loading ? "—" : stats.pending_list}
  icon={<NotepadTextDashedIcon size={18} />}
  gradient="from-purple-500 to-indigo-500"
  onClick={() => setModalType("PENDING")}
/>

      </div>

      {modalType && <DashboardModal type={modalType} onClose={() => setModalType(null)} />}
    </div>
  );
}

/* ================= CARD ================= */

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
        rounded-2xl
        px-4 py-3
        text-white
        bg-gradient-to-br ${gradient}
        border border-white/30
        shadow-[0_14px_30px_rgba(0,0,0,0.28)]
        ${onClick ? "cursor-pointer hover:scale-[1.02] transition" : ""}
      `}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-white/80">{title}</span>

        <div className="w-8 h-8 rounded-lg bg-white/25 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div className="text-2xl font-semibold leading-tight">
        {value}
      </div>
    </div>
  );
}


/* ================= MODAL ================= */

function DashboardModal({ type, onClose }: { type: ModalType; onClose: () => void }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [beds, setBeds] = useState<BedRow[]>([]);
  const [loading, setLoading] = useState(true);

  const partialCache = useRef<UserRow[]>([]);
  const overdueCache = useRef<UserRow[]>([]);
  const pendingCache = useRef<UserRow[]>([]);
  const bedsCache = useRef<BedRow[]>([]);

  useEffect(() => {
    setLoading(true);

    if (type === "BEDS" && bedsCache.current.length) {
      setBeds(bedsCache.current);
      setLoading(false);
      return;
    }
    if (type === "PARTIAL" && partialCache.current.length) {
      setUsers(partialCache.current);
      setLoading(false);
      return;
    }
    if (type === "OVERDUE" && overdueCache.current.length) {
      setUsers(overdueCache.current);
      setLoading(false);
      return;
    }
    if (type === "PENDING" && pendingCache.current.length) {
      setUsers(pendingCache.current);
      setLoading(false);
      return;
    }

    const endpoint =
      type === "BEDS"
        ? "/admin/dashboard/available-beds"
        : type === "OVERDUE"
        ? "/admin/dashboard/overdue-users"
        : type === "PARTIAL"
        ? "/admin/dashboard/partial-users"
        : "/admin/dashboard/pending-collections";

    api.get(endpoint).then((res) => {
      const data = res.data.data ?? [];
      if (type === "BEDS") {
        bedsCache.current = data;
        setBeds(data);
      } else if (type === "PARTIAL") {
        partialCache.current = data;
        setUsers(data);
      } else if (type === "OVERDUE") {
        overdueCache.current = data;
        setUsers(data);
      } else {
        pendingCache.current = data;
        setUsers(data);
      }
      setLoading(false);
    });
  }, [type]);

  /* APPROVE PAYMENT */
  const approve = async (user_id: string) => {
    await api.post(`/admin/dashboard/users/${user_id}/approve-fee`);
    pendingCache.current = pendingCache.current.filter((u) => u.user_id !== user_id);
    setUsers([...pendingCache.current]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl max-h-[85vh] bg-white/20 backdrop-blur-xl rounded-3xl flex flex-col text-white">
        {/* HEADER */}
        <div className="p-5 flex justify-between border-b border-white/20">
          <h3 className="font-semibold">
            {type === "PENDING" ? "Pending Payment Approvals" : `${type} LIST`}
          </h3>
          <button onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && <div className="text-center text-white/70">Loading…</div>}

          {!loading && type === "BEDS" &&
            beds.map((r) => (
              <div key={r.room_id} className="p-3 bg-white/20 rounded mb-2">
                Room {r.room_number} — Beds: {r.available_beds}
              </div>
            ))}

          {!loading && type !== "BEDS" && users.map((u) => (
            <div key={u.user_id} className="p-3 bg-white/20 rounded mb-2">
              <div className="font-medium">{u.user_name}</div>
              <div className="text-sm text-white/70">
                Room {u.room?.room_number} · Floor {u.room?.floor_number}
              </div>
              <div className="text-yellow-200">Due ₹ {u.due_amount}</div>

              {type === "OVERDUE" && (
                <div className="text-red-300">Delay: {u.delay_days} days</div>
              )}

              {type === "PENDING" && (
                <button
                  onClick={() => approve(u.user_id)}
                  className="mt-2 px-3 py-1 rounded bg-green-500 text-sm"
                >
                  Approve
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

