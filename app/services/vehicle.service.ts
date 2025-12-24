import api from "../lib/api";
import { Vehicle } from "../models/vehicle";
import { VerificationResult } from "../models/verification";

export const Vehicles = {
  getAll: async (): Promise<Vehicle[]> => {
    const res = await api.get("/vehicle");
    return res.data;
  },

  getById: async (VehicleNo: string): Promise<Vehicle> => {
    const res = await api.get(`/vehicle/${VehicleNo}`);
    return res.data;
  },

  add: async (payload: Vehicle): Promise<Vehicle> => {
  const res = await api.post("/vehicle", payload); // ✅ correct
  return res.data;
},


  verify: async (VehicleNo: string): Promise<VerificationResult> => {
    const res = await api.get(`/vehicle/verify/${VehicleNo}`);
    return res.data;
  },
};
