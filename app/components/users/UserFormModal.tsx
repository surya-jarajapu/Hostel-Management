"use client";

import toast from "react-hot-toast";
import Image from "next/image";
export default function UserFormModal({
  open,
  onClose,
  form,
  setForm,
  errors,
  saving,
  editingUser,
  rooms,
  saveUser,
}: {
  open: boolean;
  onClose: () => void;
  form: UserForm;
  setForm: React.Dispatch<React.SetStateAction<UserForm>>;
  errors: Partial<Record<keyof UserForm, string>>;
  saving: boolean;
  editingUser: User | null; // ✅ FIXED
  rooms: Room[];
  saveUser: () => void;
}) {
  if (!open) return null;

  const basicFields: Array<{
    key: InputFieldKey;
    label: string;
    placeholder: string;
  }> = [
    {
      key: "user_name",
      label: "Full Name",
      placeholder: "Enter full name",
    },
    {
      key: "email",
      label: "Email Address",
      placeholder: "example@email.com",
    },
    {
      key: "mobile",
      label: "Mobile Number",
      placeholder: "10-digit mobile number",
    },
    {
      key: "monthly_fee",
      label: "Monthly Fee",
      placeholder: "₹ Amount",
    },
  ];

  return (
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
        <div className="px-3 py-2 border-b border-white/20 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {editingUser ? "Edit User" : "Create User"}
          </h3>
          <button
            onClick={() => onClose()}
            className="text-white/70 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>

        {/* BODY (SCROLLABLE) */}
        <div className="px-6 py-4 overflow-y-auto space-y-4 text-gray-900">
          {/* BASIC FIELDS */}
          {basicFields.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-gray-900">
                {label}
              </label>

              <input
                type={key === "monthly_fee" ? "number" : "text"}
                placeholder={placeholder}
                className={`w-full rounded-xl px-4 py-2.5 text-sm
    bg-white/50 backdrop-blur
    border ${errors[key] ? "border-red-400" : "border-white/40"}
    focus:outline-none focus:ring-2 focus:ring-blue-400`}
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    [key]:
                      key === "monthly_fee"
                        ? e.target.value // keep string (your UserForm defines string)
                        : e.target.value,
                  }))
                }
              />

              {errors[key] && (
                <p className="text-[11px] text-red-500">{errors[key]}</p>
              )}
            </div>
          ))}

          {/* PAYMENT TYPE (CREATE ONLY) */}
          {!editingUser && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900">
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
                      setForm((f: UserForm) => ({
                        ...f,
                        payment_type: opt.value,
                        paid_amount: opt.value === "PARTIAL" ? "" : "",
                      }))
                    }
                    className={`
            py-2 rounded-xl text-sm font-medium transition
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
            <label className="text-xs font-medium text-gray-900">
              Fee Receipt <span className="text-gray-900">(optional)</span>
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
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-900">
              Joining Date
            </label>
            <input
              type="date"
              className="w-full rounded-xl px-4 py-2.5 text-sm
      bg-white/50 border border-white/40
      focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.joining_date}
              onChange={(e) =>
                setForm({ ...form, joining_date: e.target.value })
              }
            />
          </div>

          {/* ROOM */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-900">
              Room Allocation
            </label>
            <select
              className="w-full rounded-xl px-4 py-2.5 text-sm
      bg-white/50 border border-white/40
      focus:outline-none focus:ring-2 focus:ring-blue-400
      disabled:bg-gray-100"
              value={form.room_id}
              onChange={(e) => setForm({ ...form, room_id: e.target.value })}
            >
              <option value="">Select Room</option>
              {rooms.map((r: Room) => (
                <option
                  key={r.room_id}
                  value={r.room_id}
                  disabled={r.available_beds === 0}
                >
                  {r.room_number}
                  {r.available_beds === 0
                    ? " (Full)"
                    : ` (${r.available_beds} beds)`}{" "}
                  – Floor {r.floor_number}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-white/20 flex justify-end gap-3">
          <button
            onClick={() => onClose()}
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
  );
}
