"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import api from "@/app/lib/api";
import { getSupabase } from "@/app/lib/supabaseClient";
import UserFormModal from "@/app/components/users/UserFormModal";
import UserTable from "@/app/components/users/UserTable";
import UserHeader from "@/app/components/users/UserHeader";

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteUserData, setDeleteUserData] = useState<User | null>(null);

  // Search
  const [search, setSearch] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [paymentType, setPaymentType] = useState<"FULL" | "PARTIAL">("FULL");
  const [amount, setAmount] = useState<number | "">("");

  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // 🔹 Collect Fee receipt states
  const [collectPreview, setCollectPreview] = useState<string>("");

  // const [_collectReceipt, _setCollectReceipt] = useState<File | null>(null);

  const { user } = useAuth();
  // const hostelId = user?.hostel_id;

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

  const fetchUsers = useCallback(async () => {
    async (pageIndex = 0) => {
      try {
        setLoading(true);
        const res = await api.post("/user/search", {
          paging: "No",
          search: search.trim(),
          page_index: pageIndex,
          page_count: 10,
          date_format_id: "1111-1111-1111-1111",
          time_zone_id: "2222-2222-2222-2222",
        });

        setUsers(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        console.error("Fetch users error:", err);
        toast.error("Failed to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
  }, [token, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
    if (u.due_amount === 0) return "PAID";
    const overdue = u.next_fee_date && new Date(u.next_fee_date) < new Date();
    if (overdue && u.due_amount < u.monthly_fee) return "OVERDUE_PARTIAL";
    if (overdue) return "OVERDUE";
    if (u.due_amount < u.monthly_fee) return "PARTIAL";

    return "DUE";
  }, []);

  function FeeStatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; className: string }> = {
      PAID: {
        label: "Paid",
        className: "bg-green-100 text-green-700",
      },
      PARTIAL: {
        label: "Partial",
        className: "bg-yellow-100 text-yellow-700",
      },
      DUE: {
        label: "Due",
        className: "bg-orange-100 text-orange-700",
      },
      OVERDUE: {
        label: "Overdue",
        className: "bg-red-100 text-red-700",
      },
      OVERDUE_PARTIAL: {
        label: "Overdue (Partial)",
        className: "bg-red-100 text-red-700",
      },
    };

    const item = map[status];

    return (
      <span
        className={`
        inline-flex items-center
        px-3 py-1
        rounded-full
        text-[11px]
        font-medium
        ${item.className}
      `}
      >
        {item.label}
      </span>
    );
  }

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

      <UserHeader
        search={search}
        setSearch={setSearch}
        fetchUsers={fetchUsers}
        setModalOpen={setModalOpen}
      />

      <UserTable
        users={users}
        loading={loading}
        openDeleteModal={openDeleteModal}
        openEditModal={openEditModal}
        openCollectModal={openCollectModal}
        getFeeStatus={getFeeStatus}
        setReceiptPreview={setReceiptPreview}
      />

      {/* ================= MOBILE CARDS ================= */}
      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-2">
        {users.map((u) => (
          <div
            key={u.user_id}
            className="
        rounded-lg
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

              {/* <span className="text-xs font-medium">{getFeeStatus(u)}</span> */}
              <span>
                <FeeStatusBadge status={getFeeStatus(u)} />
              </span>
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
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => openEditModal(u)}
                className="
      flex-1 py-2 rounded-lg
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
        flex-1 py-2 rounded-lg
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
      flex-1 py-2 rounded-lg
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

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        form={form}
        setForm={setForm}
        errors={errors}
        saving={saving}
        editingUser={editingUser}
        rooms={rooms}
        saveUser={saveUser}
      />

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
