"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "@/app/lib/api";

type Room = {
  room_id: string;
  room_number: string;
  floor_number: string;
  available_beds: number;
  total_beds: number;
  status: string;
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    floor_number: "",
    room_number: "",
    total_beds: 1,
    status: "Active",
  });

  // FETCH ROOMS

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.post("/room/search", {
        paging: "No",
        search: "",
        date_format_id: "1111-1111-1111-1111",
        time_zone_id: "2222-2222-2222-2222",
      });

      setRooms(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Fetch rooms error:", err);
      toast.error("Failed to load rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // OPEN CREATE MODAL
  const openCreateModal = () => {
    setEditingRoom(null);
    setForm({
      floor_number: "",
      room_number: "",
      total_beds: 1,
      status: "Active",
    });
    setModalOpen(true);
  };

  // OPEN EDIT MODAL
  const openEditModal = (r: Room) => {
    setEditingRoom(r);
    setForm({
      floor_number: r.floor_number,
      room_number: r.room_number,
      total_beds: r.total_beds,
      status: r.status,
    });
    setModalOpen(true);
  };

  // CREATE / UPDATE ROOM

  const saveRoom = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const url = editingRoom ? `/room/${editingRoom.room_id}` : `/room`;

      const method = editingRoom ? "patch" : "post";

      await api[method](url, form);

      toast.success(`Room ${editingRoom ? "updated" : "created"} successfully`);
      setModalOpen(false);
      fetchRooms();
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
        toast.error(err.message);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  // DELETE ROOM
  const deleteRoom = async (id: string) => {
    if (!confirm("Delete room?")) return;

    try {
      await api.delete(`/room/${id}`);
      toast.success("Room deleted successfully");
      fetchRooms();
    } catch {
      toast.error("Failed to delete room");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-16 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-lg font-semibold text-gray-900">Manage Rooms</h1>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block rounded-3xl bg-white/40 text-gray-900 backdrop-blur-xl border border-white/30 shadow">
        {loading ? (
          <p className="p-6">Loading...</p>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="p-4">Floor</th>
                <th className="p-4">Room</th>
                <th className="p-4">Beds</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr
                  key={r.room_id}
                  className="border-b last:border-none hover:bg-white/40"
                >
                  <td className="p-4">{r.floor_number}</td>
                  <td className="p-4">{r.room_number}</td>
                  <td className="p-4">{r.total_beds}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        r.status === "Active"
                          ? "bg-green-500/20 text-green-700"
                          : "bg-red-500/20 text-red-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button
                      onClick={() => openEditModal(r)}
                      className="p-2 rounded-full bg-blue-500/20 text-blue-600 hover:bg-blue-500/30"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteRoom(r.room_id)}
                      className="p-2 rounded-full bg-red-500/20 text-red-600 hover:bg-red-500/30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-4 ">
        {rooms.map((r) => (
          <div
            key={r.room_id}
            className="rounded-lg bg-white/40 backdrop-blur-xl border border-white/30 shadow p-4 text-gray-900"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">Room {r.room_number}</div>
              <span
                className={`px-3 py-1 rounded-full text-xs ${
                  r.status === "Active"
                    ? "bg-green-500/20 text-green-700"
                    : "bg-red-500/20 text-red-700"
                }`}
              >
                {r.status}
              </span>
            </div>
            <div className="text-sm text-gray-900">Floor: {r.floor_number}</div>
            <div className="text-sm text-gray-900">Beds: {r.total_beds}</div>

            <div className="flex gap-3 mt-3">
              <button
                onClick={() => openEditModal(r)}
                className="flex-1 py-2 rounded-lg bg-blue-500/20 text-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => deleteRoom(r.room_id)}
                className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FLOATING + BUTTON */}
      <button
        onClick={openCreateModal}
        className="
          fixed bottom-24 right-5 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-[#0a84ff] to-[#5ac8fa]
          text-white flex items-center justify-center
          shadow-[0_20px_40px_rgba(0,0,0,0.45)]
          active:scale-95 transition
        "
      >
        <Plus size={26} />
      </button>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white/30 backdrop-blur-2xl border border-white/30 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingRoom ? "Edit Room" : "Create Room"}
            </h3>

            <input
              className="w-full mb-3 px-4 py-3 rounded-xl bg-white/50"
              placeholder="Floor Number"
              value={form.floor_number}
              onChange={(e) =>
                setForm({ ...form, floor_number: e.target.value })
              }
            />

            <input
              className="w-full mb-3 px-4 py-3 rounded-xl bg-white/50"
              placeholder="Room Number"
              value={form.room_number}
              onChange={(e) =>
                setForm({ ...form, room_number: e.target.value })
              }
            />

            <input
              type="number"
              className="w-full mb-3 px-4 py-3 rounded-xl bg-white/50"
              placeholder="Total Beds"
              value={form.total_beds}
              onChange={(e) =>
                setForm({
                  ...form,
                  total_beds: Number(e.target.value),
                })
              }
            />

            <select
              className="w-full mb-3 px-4 py-3 rounded-xl bg-white/50"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveRoom}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-green-600 text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
