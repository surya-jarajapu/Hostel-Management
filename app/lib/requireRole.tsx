"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function requireRole(allowedRoles: string[]) {
  return function RoleProtected({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token) {
        router.push("/login");
        return;
      }

      if (!allowedRoles.includes(role || "")) {
        router.push("/dashboard");
        return;
      }

      setAllowed(true);
    }, []);

    if (!allowed) return null;

    return <>{children}</>;
  };
}
