export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function requireAuth(allowedRoles: string[]) {
  const user = getCurrentUser();

  if (!user) return { ok: false, reason: "NO_USER" };
  if (!allowedRoles.includes(user.role)) return { ok: false, reason: "NO_ROLE" };

  return { ok: true, user };
}
