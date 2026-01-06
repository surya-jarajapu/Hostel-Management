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

type ModalType = "PARTIAL" | "OVERDUE" | "BEDS" | "PENDING" | null;

/* ================= SMALL TOP CARD ================= */

function StatMini({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/20 rounded-xl px-4 py-3">
      <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-xs text-white/80">{title}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
}

/* ================= ACTION CARD ================= */

function ActionCard({
  title,
  value,
  icon,
  onClick,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white rounded-lg p-4 text-center shadow hover:shadow-lg transition"
    >

            {/* ICON WRAPPER */}
      <div className="flex justify-center mb-2">
        <div
          className="
            w-10 h-10
            rounded-full
         bg-purple-100 text-purple-700 
            flex items-center justify-center
          "
        >
          {/* ICON FIX */}
          <span className="flex items-center justify-center">
            {icon}
          </span>
        </div>
      </div>

      <div className="text-sm font-medium text-gray-700">{title}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function AdminDashboardPage() {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

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

    api
      .get("/admin/dashboard")
      .then((res) => {
        setStats(res.data.data);
        setLoaded(true);
      })
      .catch(() => {
        setStats({
          total_users: 0,
          partial_users: 0,
          overdue_users: 0,
          available_beds: 0,
          collected_this_month: 0,
          pending_list: 0,
        });
      })
      .finally(() => setLoading(false));
  }, [loaded]);

  return (
    <div className="min-h-screen bg-gray-100 pt-14 px-2 sm:px-6">
      {/* HEADER */}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Admin Dashboard
      </h3>

      {/* ================= TOP EXPLANATION ================= */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-purple-200 to-indigo-400 rounded-lg p-4 text-gray-800 shadow-lg">
          <div className="text-sm font-bold">
            Hostel Management Overview
          </div>

         <div className="grid grid-cols-2 sm:gap-2 gap-2 mt-2">
            <StatMini
              title="Total Users"
              value={loading ? "—" : stats.total_users}
              icon={<Users size={20} />}
            />

            <StatMini
              title="Collected This Month"
              value={loading ? "—" : `₹ ${stats.collected_this_month}`}
              icon={<IndianRupee size={20} />}
            />
          </div>
        </div>
      </div>

{/* ================= ACTION CARDS ================= */}
<div className="grid grid-cols-4 gap-2 sm:gap-4 mt-3">
  <ActionCard
    title="Overdue"
    value={loading ? "—" : stats.overdue_users}
    icon={<AlarmClock />}
    onClick={() => setModalType("OVERDUE")}
  />

  <ActionCard
    title="Partial"
    value={loading ? "—" : stats.partial_users}
    icon={<CircleDollarSign />}
    onClick={() => setModalType("PARTIAL")}
  />

  <ActionCard
    title="Beds"
    value={loading ? "—" : stats.available_beds}
    icon={<BedDouble />}
    onClick={() => setModalType("BEDS")}
  />

  <ActionCard
    title="Pending"
    value={loading ? "—" : stats.pending_list}
    icon={<NotepadTextDashedIcon />}
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
      } else {
        if (type === "PARTIAL") partialCache.current = data;
        if (type === "OVERDUE") overdueCache.current = data;
        if (type === "PENDING") pendingCache.current = data;
        setUsers(data);
      }

      setLoading(false);
    });
  }, [type]);

  const approve = async (user_id: string) => {
    await api.post(`/admin/dashboard/users/${user_id}/approve-fee`);
    pendingCache.current = pendingCache.current.filter(
      (u) => u.user_id !== user_id
    );
    setUsers([...pendingCache.current]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl max-h-[85vh] bg-white/20 backdrop-blur-xl rounded-3xl flex flex-col text-white">
        <div className="p-5 flex justify-between border-b border-white/20">
          <h3 className="font-semibold">
            {type === "PENDING" ? "Pending Payment Approvals" : `${type} List`}
          </h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && <div className="text-center">Loading…</div>}

          {!loading && type === "BEDS" &&
            beds.map((r) => (
              <div key={r.room_id} className="p-3 bg-white/20 rounded mb-2">
                Room {r.room_number} — Beds: {r.available_beds}
              </div>
            ))}

          {!loading && type !== "BEDS" &&
            users.map((u) => (
              <div key={u.user_id} className="p-3 bg-white/20 rounded mb-2">
                <div className="font-medium">{u.user_name}</div>
                <div className="text-sm text-white/70">
                  Room {u.room?.room_number} · Floor {u.room?.floor_number}
                </div>
                <div className="text-yellow-200">Due ₹ {u.due_amount}</div>

                {type === "OVERDUE" && (
                  <div className="text-red-300">
                    Delay: {u.delay_days} days
                  </div>
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
