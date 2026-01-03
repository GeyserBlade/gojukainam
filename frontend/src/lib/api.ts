import axios from "axios";

// Vite exposes env via import.meta.env
const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:4000";

export const api = axios.create({ 
  baseURL: `${API_BASE}/api`,
  withCredentials: true // send cookies
});


api.interceptors.request.use((config) => {
  // Dev headers: attach role & club from localStorage (stub until real auth)
  const role = localStorage.getItem("role") || undefined;
  const clubId = localStorage.getItem("clubId") || undefined;
  if (role) (config.headers as any)["x-role"] = role;
  if (clubId) (config.headers as any)["x-club-id"] = clubId;
  return config;
});
