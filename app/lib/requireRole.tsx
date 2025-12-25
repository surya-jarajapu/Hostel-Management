"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function requireRole(allowedRoles: string[]) {
  return function RoleProtected({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const router = useRouter();
    const [allowed, setAllowed] = useState(false);

    // ✅ store roles in ref (stable, no deps needed)
    const rolesRef = useRef(allowedRoles);

    useEffect(() => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token) {
        router.push("/login");
        return;
      }

      if (!rolesRef.current.includes(role || "")) {
        router.push("/dashboard");
        return;
      }

      setAllowed(true);
    }, [router]); // ✅ only real dependency

    if (!allowed) return null;

    return <>{children}</>;
  };
}
