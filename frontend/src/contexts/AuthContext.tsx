import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { api } from "../lib/api";

/***************************************
 * src/contexts/AuthContext.tsx
 ***************************************/
export type Role = "SUPERADMIN" | "ADMIN" | "CLUB_MANAGER" | "COACH" | "ATHLETE";

export interface User {
  id: string;
  email?: string;
  role: Role;
  clubId?: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  role?: Role; // convenience accessors
  clubId?: string | null;
  
  loginDev: (payload: { role: Role; clubId?: string }) => Promise<void>;
  login: (email:string, password:string) => Promise<void>;
  requestMagicLink: (email:string) => Promise<any>;
  verifyMagicLink: (token:string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data.user) {
        setUser(res.data.user);
      } else {
        // If API says no user (but 200 OK? unlikely if 401, but logic holds), check dev fallback
        checkDevFallback();
      }
    } catch (e) {
      // If 401 or network error, fallback to dev auth from local storage
      checkDevFallback();
    } finally {
      setLoading(false);
    }
  };

  const checkDevFallback = () => {
      const role = localStorage.getItem("role") as Role;
      if (role) {
         setUser({
             id: "dev-user",
             role,
             clubId: localStorage.getItem("clubId")
         });
      } else {
         setUser(null);
      }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const loginDev: AuthContextValue["loginDev"] = async ({ role, clubId }) => {
    localStorage.setItem("role", role);
    if (clubId) localStorage.setItem("clubId", clubId); else localStorage.removeItem("clubId");
    // Force state update
    setUser({ id: "dev-user", role, clubId: clubId ?? undefined });
  };
  
  const login = async (email:string, password:string) => {
      await api.post("/auth/login", { email, password });
      // Clear dev artifacts
      ["role", "clubId"].forEach((k) => localStorage.removeItem(k));
      await checkAuth();
  };
  
  const requestMagicLink = async (email:string) => {
      const res = await api.post("/auth/magic-link", { email });
      return res.data;
  };
  
  const verifyMagicLink = async (token:string) => {
      await api.post("/auth/magic-login", { token });
       // Clear dev artifacts
      ["role", "clubId"].forEach((k) => localStorage.removeItem(k));
      await checkAuth();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch(e) {}
    ["role", "clubId", "email", "token"].forEach((k) => localStorage.removeItem(k));
    setUser(null);
  };

  const value = useMemo(() => ({ 
      user, 
      role: user?.role, 
      clubId: user?.clubId, 
      loading, 
      loginDev, login, requestMagicLink, verifyMagicLink, logout, checkAuth 
  }), [user, loading]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};