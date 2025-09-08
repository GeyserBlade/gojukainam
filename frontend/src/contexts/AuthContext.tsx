import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

/***************************************
 * src/contexts/AuthContext.tsx
 ***************************************/
export type Role = "SUPERADMIN" | "ADMIN" | "CLUB_MANAGER" | "COACH" | "ATHLETE";

interface AuthState {
  role?: Role;
  clubId?: string | null;
  email?: string | null;
  token?: string | null; // reserved for future JWT/magic-link
}

interface AuthContextValue extends AuthState {
  loginDev: (payload: { role: Role; clubId?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(() => ({
    role: (localStorage.getItem("role") as Role) || undefined,
    clubId: localStorage.getItem("clubId"),
    email: localStorage.getItem("email"),
    token: localStorage.getItem("token"),
  }));

  const loginDev: AuthContextValue["loginDev"] = async ({ role, clubId }) => {
    localStorage.setItem("role", role);
    if (clubId) localStorage.setItem("clubId", clubId); else localStorage.removeItem("clubId");
    setAuth((s) => ({ ...s, role, clubId: clubId ?? null }));
  };

  const logout = () => {
    ["role", "clubId", "email", "token"].forEach((k) => localStorage.removeItem(k));
    setAuth({});
  };

  const value = useMemo(() => ({ ...auth, loginDev, logout }), [auth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
