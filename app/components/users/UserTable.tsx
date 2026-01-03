"use client";
import Image from "next/image";

export default function UserTable({
  users,
  loading,
  openDeleteModal,
  openEditModal,
  openCollectModal,
  getFeeStatus,
  setReceiptPreview,
}: UserTableProps) {
  return (
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
            {users.map((u: User) => (
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
                        setReceiptPreview(u.user_fee_receipt as string)
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
                    onClick={() => openCollectModal(u)}
                    className="
         m-1
        bg-green-500/20 text-green-700
        text-sm font-medium
      "
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
  );
}
