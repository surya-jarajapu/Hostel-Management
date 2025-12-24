"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.push("/venues");
  }, []);

  return null; // nothing to show, it redirects automatically
}
