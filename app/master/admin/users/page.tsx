"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import api from "@/app/lib/api";

import { getSupabase } from "@/app/lib/supabaseClient";

export default function AdminUsersPage() {
  // UI state
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auth / token
  const [token, setToken] = useState<string | null>(null);

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Selection
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteUserData, setDeleteUserData] = useState<User | null>(null);

  // Search
  const [search, setSearch] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [paymentType, setPaymentType] = useState<"FULL" | "PARTIAL">("FULL");
  const [amount, setAmount] = useState<number | "">("");

  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // 🔹 Collect Fee receipt states
  const [collectPreview, setCollectPreview] = useState<string>("");

  // const [_collectReceipt, _setCollectReceipt] = useState<File | null>(null);

  const { user } = useAuth();
  // const hostelId = user?.hostel_id;

  type Room = {
    room_id: string;
    room_number: string;
    floor_number: number;
    available_beds: number;
  };

  type User = {
    user_id: string;
    user_name: string;
    email?: string;
    mobile?: string;
    joining_date: string;
    monthly_fee: number;
    due_amount: number;
    delay_days: number;
    next_fee_date?: string;
    status: string;
    user_fee_receipt?: string;
    room?: Room;
  };

  // type BackendResponse<T> = {
  //   status: boolean;
  //   message?: string;
  //   data: T;
  //   errors?: { field: string; message: string }[];
  // };

  type UserForm = {
    user_name: string;
    email: string;
    mobile: string;
    monthly_fee: string;
    joining_date: string;
    room_id: string;
    status: string;
    payment_type: string;
    paid_amount: string;
    user_fee_receipt: string;
    user_fee_receipt_file: File | null;
    user_fee_receipt_preview: string;
  };

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
  }, []);

  const [form, setForm] = useState<UserForm>({
    user_name: "",
    email: "",
    mobile: "",
    monthly_fee: "",
    joining_date: new Date().toISOString().split("T")[0],
    room_id: "",
    status: "Active",
    payment_type: "NONE",
    paid_amount: "",
    user_fee_receipt: "",
    user_fee_receipt_file: null,
    user_fee_receipt_preview: "",
  });

  const basicFields: Array<{
    key: "user_name" | "email" | "mobile" | "monthly_fee";
    label: string;
  }> = [
    { key: "user_name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "mobile", label: "Mobile" },
    { key: "monthly_fee", label: "Monthly Fee" },
  ];

  // =========================
  // HELPERS
  // =========================
  const uploadReceipt = async (file: File) => {
    if (typeof window === "undefined") {
      throw new Error("Upload must run in browser");
    }

    const supabase = getSupabase();

    const fileName = `receipts/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("receipts")
      .upload(fileName, file, {
        upsert: false,
        cacheControl: "3600",
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }

    const { data } = supabase.storage.from("receipts").getPublicUrl(fileName);

    return data.publicUrl;
  };


  // =========================
  // FETCH USERS
  // =========================

  const fetchUsers = useCallback(
    async (pageIndex = 0) => {
      if (!token) return;

      try {
        setLoading(true);

        const res = await api.post(
          "/user/search",
          {
            paging: "No",
            search: search.trim(),
            page_index: pageIndex,
            page_count: 10,
            date_format_id: "1111-1111-1111-1111",
            time_zone_id: "2222-2222-2222-2222",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUsers(res.data.status ? res.data.data : []);
      } catch (error) {
        console.error("Fetch users failed", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [token, search]
  );

  // =========================
  // FETCH AVAILABLE ROOMS
  // =========================

  const fetchRooms = async () => {
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/room/search`,
        {
          method: "POST", // ✅ REQUIRED
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ JWT → hostel scoped
          },
          body: JSON.stringify({
            paging: "No",
            search: "",

            // 🔴 REQUIRED BY BACKEND (YOU MISSED THIS)
            date_format_id: "1111-1111-1111-1111",
            time_zone_id: "2222-2222-2222-2222",
          }),
        }
      );

      const json = await res.json();

      if (json?.status === false) {
        setRooms([]);
        return;
      }

      setRooms(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Fetch rooms failed", err);
      setRooms([]);
    }
  };

  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (!modalOpen) {
      fetchedOnce.current = false;
      return;
    }

    if (fetchedOnce.current) return;

    fetchedOnce.current = true;
    fetchRooms();
  }, [modalOpen]);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, fetchUsers]);

  useEffect(() => {
    if (!collectOpen && collectPreview) {
      URL.revokeObjectURL(collectPreview);
      setCollectPreview("");
      // _setCollectReceipt(null);
    }
  }, [collectOpen]);

  const getFeeStatus = useCallback((u: User) => {
    if (u.due_amount === 0) return "🟢 Paid";
    const overdue = u.next_fee_date && new Date(u.next_fee_date) < new Date();
    if (overdue && u.due_amount < u.monthly_fee) return "🔴 Overdue (Partial)";
    if (overdue) return "🔴 Overdue";
    if (u.due_amount < u.monthly_fee) return "🟡 Partial";
    return "🟡 Due";
  }, []);

  // =========================
  // MODAL HANDLERS
  // =========================
  const openCreateModal = () => {
    setEditingUser(null);
    setErrors({});
    setForm({
      user_name: "",
      email: "",
      mobile: "",
      monthly_fee: "",
      joining_date: new Date().toISOString().split("T")[0],
      payment_type: "NONE", // NONE | FULL | PARTIAL
      room_id: "",
      status: "Active",
      paid_amount: "",
      user_fee_receipt: "",
      user_fee_receipt_file: null as File | null,
      user_fee_receipt_preview: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setErrors({});

    setForm({
      user_name: u.user_name,
      email: u.email ?? "",
      mobile: u.mobile ?? "",
      monthly_fee: String(u.monthly_fee), // ✅ convert number → string
      joining_date: u.joining_date.split("T")[0],
      payment_type: "NONE",
      room_id: u.room?.room_id ?? "",
      status: u.status,
      paid_amount: "",
      user_fee_receipt: u.user_fee_receipt ?? "",
      user_fee_receipt_file: null, // ✅ MUST be File | null
      user_fee_receipt_preview: u.user_fee_receipt ?? "",
    });

    setModalOpen(true);
  };

  const openCollectModal = (u: User) => {
    setSelectedUser(u);
    setPaymentType("FULL");
    setAmount(u.due_amount);
    setCollectOpen(true);
  };

  const collectFee = async () => {
    // 🔐 Guard: selectedUser CAN be null
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }
    if (amount === "") {
      toast.error("Enter amount");
      return;
    }

    if (amount <= 0 || amount > selectedUser.due_amount) {
      toast.error("Invalid amount");
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/user/${selectedUser.user_id}/collect-fee`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          type: paymentType,
        }),
      }
    );

    if (!res.ok) {
      toast.error("Failed to collect");
      return;
    }

    toast.success("Payment collected");
    setCollectOpen(false);
    fetchUsers();
  };

  // =========================
  // SAVE USER
  // =========================
  const saveUser = async () => {
    if (saving) return;

    // 🔐 TOKEN SAFETY (MOST IMPORTANT)
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      toast.error("Session expired. Please login again.");
      return;
    }

    setErrors({});
    setSaving(true);

    const isEdit = !!editingUser;
    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_API_URL}/user/${editingUser.user_id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/user`;

    try {
      let receiptUrl: string | undefined = form.user_fee_receipt || undefined;

      // 📤 1️⃣ Upload receipt FIRST (NO backend JWT here)
      if (form.user_fee_receipt_file instanceof File) {
        receiptUrl = await uploadReceipt(form.user_fee_receipt_file);
      }

      // 📦 2️⃣ Build payload (CLEAN)
      const payload: Record<string, unknown> = {
        user_name: form.user_name.trim(),
        monthly_fee: Number(form.monthly_fee),
        joining_date: form.joining_date,
        status: form.status,

        ...(form.mobile?.trim() && { mobile: form.mobile.trim() }),
        ...(form.email?.trim() && { email: form.email.trim() }),
        ...(form.room_id && { room_id: form.room_id }),
        ...(receiptUrl && { user_fee_receipt: receiptUrl }),
      };

      // 💰 CREATE ONLY
      if (!isEdit) {
        payload.payment_type = form.payment_type;

        if (form.payment_type === "PARTIAL") {
          payload.paid_amount = Number(form.paid_amount);
        }
      }

      // 🌐 3️⃣ Backend request (VALID JWT ONLY)
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`, // ✅ ALWAYS VALID
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // ❌ BUSINESS ERROR
      if (data?.status === false) {
        toast.error(data.message || "Operation failed");
        return;
      }

      // ❌ VALIDATION ERROR
      if (!res.ok) {
        if (Array.isArray(data?.errors)) {
          const e: Record<string, string> = {};

          data.errors?.forEach((x: { field: string; message: string }) => {
            e[x.field] = x.message;
          });

          setErrors(e);
          toast.error("Fix validation errors");
        } else {
          toast.error(data.message || "Request failed");
        }
        return;
      }

      // ✅ SUCCESS
      toast.success(
        isEdit ? "User updated successfully" : "User created successfully"
      );
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Save user error:", err);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE USER
  // =========================
  const openDeleteModal = (u: User) => {
    setDeleteUserData(u);
    setDeleteOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserData) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/user/${deleteUserData.user_id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      toast.error("Failed to delete user");
      return;
    }

    toast.success("User deleted successfully");
    setDeleteOpen(false);
    setDeleteUserData(null);
    fetchUsers();
  };

  const paymentOptions: Array<{
    label: string;
    value: "FULL" | "PARTIAL";
  }> = [
    { label: "Full", value: "FULL" },
    { label: "Partial", value: "PARTIAL" },
  ];

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-100 pt-16 px-4 sm:px-6 pb-32 text-gray-800">
      {/* HEADER */}
      <div className="mb-4">
        {/* TITLE */}
        <h1 className="text-lg sm:text-3xl font-semibold text-gray-900">
          Hostel Users
        </h1>

        {/* SEARCH */}
        <div className="mt-2 flex gap-2">
          <input
            className="
        flex-1 rounded-xl
        bg-white/60 backdrop-blur
        border border-gray-200
        px-4 py-2 text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search name / mobile / room"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            onClick={() => fetchUsers(0)}
            className="
        rounded-xl
        bg-gradient-to-br from-[#0a84ff] to-[#5ac8fa]
        text-white px-4 py-2 text-sm
        shadow
      "
          >
            Search
          </button>
        </div>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block rounded-3xl bg-white/40 backdrop-blur-xl border border-white/30 shadow p-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-gray-700 border-b">
              <tr>
                <th>Name</th>
                <th>Room</th>
                <th>Floor</th>
                <th>Mobile</th>
                <th>Joining</th>
                <th>Next Fee</th>
                <th>Status</th>
                <th>Delay</th>
                <th>Fee ₹</th>
                <th>Due ₹</th>
                <th>Receipt</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-b last:border-0">
                  <td>{u.user_name}</td>
                  <td>{u.room?.room_number || "-"}</td>
                  <td>{u.room?.floor_number || "-"}</td>
                  <td>{u.mobile || "-"}</td>
                  <td>
                    {u.joining_date
                      ? new Date(u.joining_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    {u.next_fee_date
                      ? new Date(u.next_fee_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{getFeeStatus(u)}</td>
                  <td>{u.delay_days > 0 ? `${u.delay_days} days` : "-"}</td>
                  <td>₹{u.monthly_fee}</td>
                  <td>₹{u.due_amount}</td>

                  <td className="text-center">
                    {u.user_fee_receipt ? (
                      <Image
                        src={u.user_fee_receipt}
                        alt="Receipt"
                        width={48}
                        height={48}
                        quality={90}
                        className="rounded object-contain cursor-pointer"
                        onClick={() =>
                          setReceiptPreview(u.user_fee_receipt ?? null)
                        }
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No Img</span>
                    )}
                  </td>

                  <td className="flex gap-2">
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-1 rounded bg-blue-50 text-blue-600"
                    >
                      ✏️
                    </button>

                    <button
                      disabled={amount === "" || amount <= 0}
                      className="disabled:opacity-50"
                    >
                      Collect
                    </button>

                    <button
                      onClick={() => openDeleteModal(u)}
                      className="p-1 rounded bg-red-50 text-red-600"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= MOBILE CARDS ================= */}
      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-2">
        {users.map((u) => (
          <div
            key={u.user_id}
            className="
        rounded-2xl
        bg-white/60 backdrop-blur-xl
        border border-white/30
        shadow
        p-2
      "
          >
            {/* ROW 1 */}
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-gray-900">
                Name : {u.user_name}
              </div>

              <span className="text-xs font-medium">{getFeeStatus(u)}</span>
            </div>

            {/* ROW 2 – GRID */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-800">
              <div>
                Room : <b>{u.room?.room_number || "-"}</b>
              </div>
              <div>
                Floor : <b>{u.room?.floor_number || "-"}</b>
              </div>

              <div>
                Mobile : <b>{u.mobile || "-"}</b>
              </div>
              <div>
                Monthly Fee : <b>₹{u.monthly_fee}</b>
              </div>

              <div>
                Due : <b className="text-red-600">₹{u.due_amount}</b>
              </div>
              <div>
                Delay : <b>{u.delay_days > 0 ? `${u.delay_days} days` : "-"}</b>
              </div>

              <div className="col-span-2">
                Next Fee :{" "}
                <b>
                  {u.next_fee_date
                    ? new Date(u.next_fee_date).toLocaleDateString()
                    : "-"}
                </b>
              </div>
            </div>

            {/* RECEIPT */}
            <div className="mt-3">
              <span className="text-xs text-gray-500">Receipt</span>

              {u.user_fee_receipt ? (
                <Image
                  src={u.user_fee_receipt}
                  alt="Receipt image"
                  width={48}
                  height={48}
                  quality={90}
                  className="mt-1 rounded border object-contain cursor-pointer bg-white"
                  onClick={() => setReceiptPreview(u.user_fee_receipt ?? null)}
                />
              ) : (
                <div className="text-xs text-gray-400 mt-1">No Image</div>
              )}
            </div>

            {/* ACTIONS */}
            {/* ACTIONS */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => openEditModal(u)}
                className="
      flex-1 py-2 rounded-xl
      bg-blue-500/20 text-blue-700
      text-sm font-medium
    "
              >
                Edit
              </button>

              {u.due_amount > 0 && (
                <button
                  onClick={() => openCollectModal(u)}
                  className="
        flex-1 py-2 rounded-xl
        bg-green-500/20 text-green-700
        text-sm font-medium
      "
                >
                  Collect
                </button>
              )}

              <button
                onClick={() => openDeleteModal(u)}
                className="
      flex-1 py-2 rounded-xl
      bg-red-500/20 text-red-700
      text-sm font-medium
    "
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div
            className="
        w-full max-w-md max-h-[90vh]
        rounded-3xl
        bg-white/30 backdrop-blur-2xl
        border border-white/30
        shadow-[0_30px_70px_rgba(0,0,0,0.45)]
        flex flex-col
      "
          >
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-white/20 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingUser ? "Edit User" : "Create User"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-white/70 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {/* BODY (SCROLLABLE) */}
            <div className="px-6 py-4 overflow-y-auto space-y-4 text-gray-900">
              {/* BASIC FIELDS */}
              {basicFields.map(({ key, label }) => (
                <div key={key}>
                  <input
                    type={key === "monthly_fee" ? "number" : "text"}
                    placeholder={label}
                    className={`w-full rounded-xl px-4 py-3 text-sm
        bg-white/50 backdrop-blur
        border ${errors[key] ? "border-red-400" : "border-white/40"}
        focus:outline-none focus:ring-2 focus:ring-blue-400`}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />

                  {errors[key] && (
                    <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
                  )}
                </div>
              ))}

              {/* PAYMENT TYPE (CREATE ONLY) */}
              {!editingUser && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Payment Type
                  </label>

                  {/* SEGMENTED BUTTONS */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Later", value: "NONE" },
                      { label: "Full", value: "FULL" },
                      { label: "Partial", value: "PARTIAL" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            payment_type: opt.value,
                            paid_amount: opt.value === "PARTIAL" ? "" : "",
                          }))
                        }
                        className={`
            py-3 rounded-xl text-sm font-medium transition
            ${
              form.payment_type === opt.value
                ? "bg-blue-500 text-white shadow"
                : "bg-white/60 text-gray-800 border border-white/40"
            }
          `}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* PARTIAL AMOUNT */}
                  {form.payment_type === "PARTIAL" && (
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="Paid Amount"
                      className="
          w-full rounded-xl px-4 py-3
          bg-white/60 backdrop-blur
          border border-white/40
          focus:outline-none focus:ring-2 focus:ring-blue-400
        "
                      value={form.paid_amount || ""}
                      onChange={(e) =>
                        setForm({ ...form, paid_amount: e.target.value })
                      }
                    />
                  )}
                </div>
              )}

              {/* RECEIPT UPLOAD */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Fee Receipt <span className="text-gray-400">(optional)</span>
                </label>

                <label
                  htmlFor="receipt-upload"
                  className="
      relative flex items-center justify-center
      w-full h-9
      rounded-xl
      border border-dashed border-gray-300
      bg-white/50 backdrop-blur
      cursor-pointer
      hover:border-blue-400
      transition
    "
                >
                  {!form.user_fee_receipt_preview ? (
                    <div className="flex items-center gap-3 text-gray-500">
                      <span className="text-lg">📷</span>
                      <span className="text-sm">Upload receipt</span>
                    </div>
                  ) : (
                    <>
                      <Image
                        src={form.user_fee_receipt_preview}
                        alt="Receipt preview"
                        fill
                        className="object-contain rounded-xl p-1"
                      />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setForm({
                            ...form,
                            user_fee_receipt_file: null,
                            user_fee_receipt_preview: "",
                          });
                        }}
                        className="
            absolute top-1.5 right-1.5
            bg-black/60 text-white
            text-[10px] px-1.5 py-0.5
            rounded-md
          "
                      >
                        ✕
                      </button>
                    </>
                  )}
                </label>

                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (!file.type.startsWith("image/")) {
                      toast.error("Only image files allowed");
                      return;
                    }

                    if (file.size > 2 * 1024 * 1024) {
                      toast.error("Image must be under 2MB");
                      return;
                    }

                    setForm({
                      ...form,
                      user_fee_receipt_file: file,
                      user_fee_receipt_preview: URL.createObjectURL(file),
                    });
                  }}
                />
              </div>

              {/* IMAGE PREVIEW (IMAGE ONLY) */}
              {form.user_fee_receipt_preview && (
                <div className="relative">
                  <Image
                    alt="Receipt image"
                    src={form.user_fee_receipt_preview}
                    width={36}
                    height={40}
                    className="w-full h-24 object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        user_fee_receipt_file: null,
                        user_fee_receipt_preview: "",
                      })
                    }
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* JOINING DATE */}
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2"
                value={form.joining_date}
                onChange={(e) =>
                  setForm({ ...form, joining_date: e.target.value })
                }
              />

              {/* ROOM */}
              <select
                className="w-full rounded-md border px-3 py-2 disabled:bg-gray-100"
                value={form.room_id}
                onChange={(e) => setForm({ ...form, room_id: e.target.value })}
              >
                <option value="">Select Room</option>

                {rooms.map((r) => (
                  <option
                    key={r.room_id}
                    value={r.room_id}
                    disabled={r.available_beds === 0}
                  >
                    {r.room_number}
                    {r.available_beds === 0
                      ? " (Full)"
                      : ` (${r.available_beds} beds)`}
                    -{` [${r.floor_number} Floor]`}
                  </option>
                ))}
              </select>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 border-t border-white/20 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveUser}
                disabled={saving}
                className="
  px-5 py-2 rounded-xl
  bg-gradient-to-br from-green-500 to-emerald-500
  text-white
  disabled:opacity-50
"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLLECT FEE MODAL */}
      {collectOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div
            className="
        w-full max-w-sm
        rounded-3xl
        bg-white/30 backdrop-blur-2xl
        border border-white/30
        shadow-[0_30px_70px_rgba(0,0,0,0.45)]
      "
          >
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-white/20 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Collect Fee</h3>
              <button
                onClick={() => setCollectOpen(false)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="px-6 py-4 space-y-3 text-gray-900">
              <p>
                <b>Name:</b> {selectedUser.user_name}
              </p>
              <p>
                <b>Room:</b> {selectedUser.room?.room_number || "-"}
              </p>
              <p>
                <b>Due:</b> ₹{selectedUser.due_amount}
              </p>

              {/* PAYMENT TYPE */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Payment Type
                </label>

                {/* SEGMENTED BUTTONS */}
                <div className="grid grid-cols-2 gap-2">
                  {paymentOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setPaymentType(opt.value); // ✅ NO ERROR
                        if (opt.value === "FULL") {
                          setAmount(selectedUser.due_amount);
                        } else {
                          setAmount("");
                        }
                      }}
                      className={`
        py-3 rounded-xl text-sm font-medium transition
        ${
          paymentType === opt.value
            ? "bg-green-500 text-white"
            : "bg-white/60 text-gray-800 border"
        }
      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* AMOUNT INPUT */}
                {paymentType === "PARTIAL" && (
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Enter amount"
                    className="
        w-full rounded-xl px-4 py-3
        bg-white/60 backdrop-blur
        border border-white/40
        focus:outline-none focus:ring-2 focus:ring-green-400
      "
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value) || "")}
                  />
                )}
              </div>

              {/* RECEIPT */}
              <input
                type="file"
                accept="image/*"
                className="text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // _setCollectReceipt(file);
                  setCollectPreview(URL.createObjectURL(file));
                }}
              />

              {collectPreview && (
                <div className="relative">
                  <Image
                    alt="Receipt image"
                    src={collectPreview}
                    height={36}
                    width={36}
                    className="object-contain rounded-lg"
                  />
                  <button
                    onClick={() => {
                      // _setCollectReceipt(null);
                      setCollectPreview("");
                    }}
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div
              className="
  px-5 py-2 rounded-xl
  bg-gradient-to-br from-green-500 to-emerald-500
  text-white
"
            >
              <button
                onClick={() => setCollectOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={collectFee}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Collect
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && deleteUserData && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div
            className="
    w-[380px]
    rounded-3xl
    bg-white/30 backdrop-blur-2xl
    border border-white/30
    shadow-[0_30px_70px_rgba(0,0,0,0.45)]
    p-6
  "
          >
            <h3 className="text-lg font-semibold text-red-600 mb-3">
              Delete User
            </h3>

            <p className="mb-2">Are you sure you want to delete this user?</p>

            <div className="bg-gray-50 p-3 rounded mb-4">
              <p>
                <b>Name:</b> {deleteUserData.user_name}
              </p>
              <p>
                <b>Room:</b>{" "}
                {deleteUserData.room?.room_number || "Not Assigned"}
              </p>
            </div>

            <p className="text-sm text-red-500 mb-4">
              ⚠️ This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteUserData(null);
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={confirmDeleteUser}
                className="
  px-5 py-2 rounded-xl
  bg-gradient-to-br from-red-500 to-pink-500
  text-white
"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div
            className="
        w-[360px]
        rounded-3xl
        bg-white/30 backdrop-blur-2xl
        border border-white/30
        shadow-[0_30px_70px_rgba(0,0,0,0.45)]
        p-4 relative
      "
          >
            <button
              onClick={() => setReceiptPreview(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h3 className="text-sm font-semibold mb-3 text-center">
              Fee Receipt
            </h3>

            <Image
              src={receiptPreview}
              alt="Receipt image"
              className="w-full max-h-[60vh] object-contain rounded bg-white"
            />
          </div>
        </div>
      )}

      <button
        onClick={openCreateModal}
        className="
    fixed bottom-24 right-5 z-50
    w-14 h-14 rounded-full
    bg-gradient-to-br from-[#0a84ff] to-[#5ac8fa]
    text-white text-2xl
    shadow-[0_20px_40px_rgba(0,0,0,0.45)]
    active:scale-95 transition
  "
      >
        +
      </button>
    </div>
  );
}
