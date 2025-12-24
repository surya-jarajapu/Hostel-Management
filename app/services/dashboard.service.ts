import api from "../lib/api"; // ✅ using shared axios instance
import toast from "react-hot-toast";

export type DashboardSummary = {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
};

// ✅ Fetch dashboard summary
export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    const res = await api.get("/dashboard/summary");
    return res.data; // { total, approved, rejected, pending }
  } catch (err: any) {
    console.error("Dashboard API Error:", err.response?.data || err.message);
    toast.error("Failed to load dashboard summary");
    return null;
  }
}
