"use client";

import { useEffect, useState } from "react";
import {
  Users,
  BedDouble,
  IndianRupee,
  CircleDollarSign,
  AlarmClock,
  NotepadTextDashedIcon,
} from "lucide-react";

/* ================= TYPES ================= */

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

    fetch("http://localhost:3000/admin/dashboard", {
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

      {/* Modals */}
      {modalType === "PARTIAL" && (
        <DashboardModal
          type="PARTIAL"
          title="Partial Payment Users"
          endpoint="/admin/dashboard/partial-users"
          onClose={() => setModalType(null)}
        />
      )}

      {modalType === "OVERDUE" && (
        <DashboardModal
          type="OVERDUE"
          title="Overdue Users"
          endpoint="/admin/dashboard/overdue-users"
          onClose={() => setModalType(null)}
        />
      )}

      {modalType === "BEDS" && (
        <DashboardModal
          type="BEDS"
          title="Available Beds"
          endpoint="/admin/dashboard/available-beds"
          onClose={() => setModalType(null)}
        />
      )}

      {modalType === "PENDING" && (
        <PendingApprovalModal
          type="PENDING"
          title="pEMDING LIST"
          endpoint="/admin/dashboard/pending-collections"
          onClose={() => setModalType(null)}
        />
      )}
    </div>
  );
}

/* ================= STAT CARD ================= */

function StatCard({ title, value, icon, gradient, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-3xl text-white
        bg-gradient-to-br ${gradient}
        backdrop-blur-xl
        border border-white/30
        shadow-[0_20px_45px_rgba(0,0,0,0.35)]
        p-4 sm:p-6
        ${onClick ? "cursor-pointer hover:scale-[1.03] transition" : ""}
      `}
    >
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <span className="text-sm text-white/80">{title}</span>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/25 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div className="text-2xl sm:text-3xl font-semibold">{value}</div>
    </div>
  );
}

/* ================= MODAL ================= */

function PendingApprovalModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const token = localStorage.getItem("token");

  const fetchData = () => {
    fetch("http://localhost:3000/admin/dashboard/pending-collections", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => setRows(Array.isArray(j) ? j : j.data ?? []));
  };

  useEffect(fetchData, []);

  const approve = async (user_id: string) => {
    await fetch(
      `http://localhost:3000/admin/dashboard/users/${user_id}/approve-fee`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    fetchData(); // refresh list
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-4xl rounded-3xl bg-white/20 backdrop-blur-2xl border border-white/30 text-white overflow-hidden">
        {/* Header */}
        <div className="p-5 flex justify-between border-b border-white/20">
          <h3 className="font-semibold text-lg">Pending Payment Approvals</h3>
          <button onClick={onClose}>✕</button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block p-5">
          <table className="w-full text-sm">
            <thead className="text-white/70 border-b border-white/20">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Room</th>
                <th className="p-2 text-left">Floor</th>
                <th className="p-2 text-left">Due</th>
                <th className="p-2 text-left">Delay</th>
                <th className="p-2 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id} className="border-b border-white/10">
                  <td className="p-2 font-medium">{r.user_name}</td>
                  <td className="p-2">{r.room?.room_number}</td>
                  <td className="p-2">{r.room?.floor_number}</td>
                  <td className="p-2 text-yellow-200">₹ {r.due_amount}</td>
                  <td className="p-2 text-red-300">{r.delay_days} days</td>
                  <td className="p-2">
                    <button
                      onClick={() => approve(r.user_id)}
                      className="px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-3">
          {rows.map((r) => (
            <div
              key={r.user_id}
              className="rounded-2xl bg-white/20 border border-white/30 p-4"
            >
              <div className="font-medium text-lg">{r.user_name}</div>

              <div className="text-sm text-white/70">
                Room {r.room?.room_number} · Floor {r.room?.floor_number}
              </div>

              <div className="text-sm text-yellow-200 mt-1">
                Due: ₹ {r.due_amount}
              </div>

              <div className="text-sm text-red-300">
                Delay: {r.delay_days} days
              </div>

              <button
                onClick={() => approve(r.user_id)}
                className="mt-3 w-full rounded-xl bg-green-500 py-2 text-sm font-medium"
              >
                Approve Payment
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardModal({
  title,
  endpoint,
  onClose,
  type,
}: {
  title: string;
  endpoint: string;
  onClose: () => void;
  type: ModalType;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const isBeds = type === "BEDS";

  useEffect(() => {
    fetch(`http://localhost:3000${endpoint}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((json) => setRows(json.data ?? []));
  }, [endpoint]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white/20 backdrop-blur-2xl border border-white/30 text-white overflow-hidden">
        {/* Header */}
        <div className="p-5 flex justify-between border-b border-white/20">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose}>✕</button>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block p-5">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={i} className="border-b border-white/10">
                  {isBeds ? (
                    <>
                      <td className="p-2">{r.room_number}</td>
                      <td className="p-2">{r.available_beds}</td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">{r.user_name}</td>
                      <td className="p-2">
                        {r.room?.room_number} – {r.room?.floor_number}
                      </td>
                      <td className="p-2">{r.mobile}</td>
                      {type === "OVERDUE" && (
                        <td className="p-2">{r.delay_days} days</td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden p-4 space-y-3">
          {rows.map((r: any, i: number) => (
            <div
              key={i}
              className="rounded-2xl bg-white/20 border border-white/30 p-4"
            >
              {isBeds ? (
                <>
                  <div className="font-medium">Room {r.room_number}</div>
                  <div className="text-sm text-white/70">
                    Available beds: {r.available_beds}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-medium">{r.user_name}</div>
                  <div className="text-sm text-white/70">
                    Room {r.room?.room_number} – Floor {r.room?.floor_number}
                  </div>
                  <div className="text-sm text-white/70">
                    Mobile: {r.mobile}
                  </div>
                  {type === "OVERDUE" && (
                    <div className="text-sm text-red-200 mt-1">
                      Delay: {r.delay_days} days
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
