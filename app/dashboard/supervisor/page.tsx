"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requireAuth } from "@/app/utils/auth";

export default function OwnerDashboard() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const auth = requireAuth(["OWNER", "ADMIN"]);

    if (!auth.ok) {
      router.push("/login");
    } else {
      setAllowed(true);
    }
  }, []);

  if (!allowed) return null;

  return (
    <div className="p-6 mt-10">
      <h1 className="text-3xl font-semibold text-gray-800">🏟 Owner Dashboard</h1>

      <p className="mt-4 text-gray-600">
        Here you can manage your playgrounds, courts, and slots.
      </p>

      <div className="mt-6 space-y-3">
        <button
          className="bg-green-600 text-white px-5 py-2 rounded"
          onClick={() => router.push("/owner/playgrounds")}
        >
          Manage Playgrounds
        </button>

        <button
          className="bg-blue-600 text-white px-5 py-2 rounded"
          onClick={() => router.push("/owner/slots")}
        >
          Manage Slots
        </button>
      </div>
    </div>
  );
}
