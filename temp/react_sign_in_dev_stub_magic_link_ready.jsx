import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

/***************************************
 * src/lib/api.ts - axios wrapper
 ***************************************/
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((config) => {
  // Dev headers: attach role & club from localStorage (stub until real auth)
  const role = localStorage.getItem("role") || undefined;
  const clubId = localStorage.getItem("clubId") || undefined;
  if (role) config.headers["x-role"] = role;
  if (clubId) config.headers["x-club-id"] = clubId;
  return config;
});

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

/***************************************
 * src/components/Input.tsx (tiny UI helpers)
 ***************************************/
export const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-200 mb-1">{children}</label>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={[
      "w-full rounded-xl bg-gray-800/60 border border-gray-700 px-4 py-2 text-gray-100",
      "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
    ].join(" ")}
  />
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button
    {...props}
    className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2 transition disabled:opacity-50"
  >
    {children}
  </button>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className="w-full rounded-xl bg-gray-800/60 border border-gray-700 px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
  />
);

/***************************************
 * src/pages/SignIn.tsx
 ***************************************/
const roles: Role[] = ["SUPERADMIN", "ADMIN", "CLUB_MANAGER", "COACH", "ATHLETE"];

export const SignInPage: React.FC = () => {
  const { loginDev } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"dev" | "magic">("dev");
  const [role, setRole] = useState<Role>("CLUB_MANAGER");
  const [clubId, setClubId] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onDevSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    await loginDev({ role, clubId: clubId || undefined });
    nav("/dashboard");
  }

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setSending(true);
    try {
      // This calls your future backend: POST /api/auth/magic-link { email }
      // For now we just simulate success.
      // await api.post("/auth/magic-link", { email });
      localStorage.setItem("email", email);
      setInfo("Check your email for the sign-in link (simulated in dev).");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to send magic link");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/60 backdrop-blur rounded-3xl border border-gray-800 shadow-2xl p-8">
          <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
          <p className="text-sm text-gray-400 mb-6">Karate Championships Admin · Namibia</p>

          <div className="flex gap-2 mb-6">
            <button onClick={() => setMode("dev")} className={`flex-1 rounded-xl px-4 py-2 border ${mode === "dev" ? "bg-cyan-500 text-black border-cyan-400" : "border-gray-700 hover:bg-gray-800"}`}>Dev Login</button>
            <button onClick={() => setMode("magic")} className={`flex-1 rounded-xl px-4 py-2 border ${mode === "magic" ? "bg-cyan-500 text-black border-cyan-400" : "border-gray-700 hover:bg-gray-800"}`}>Email Link</button>
          </div>

          {mode === "dev" ? (
            <form onSubmit={onDevSignIn} className="space-y-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="club">Club ID (optional for admins)</Label>
                <Input id="club" placeholder="e.g. clb_xxx" value={clubId} onChange={(e)=>setClubId(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">If you sign in as CLUB_MANAGER/COACH, provide your clubId so API calls scope correctly.</p>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit">Continue</Button>
              <p className="text-xs text-gray-500 text-center">This mode stores <code>role</code> and <code>clubId</code> in localStorage and sends them as <code>x-role</code> / <code>x-club-id</code> headers.</p>
            </form>
          ) : (
            <form onSubmit={onMagicLink} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="you@dojo.org" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {info && <p className="text-emerald-400 text-sm">{info}</p>}
              <Button disabled={sending} type="submit">{sending ? "Sending..." : "Send magic link"}</Button>
              <p className="text-xs text-gray-500 text-center">Wire this to <code>POST /api/auth/magic-link</code> on your backend. In dev, check MailDev or console logs.</p>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">v0.1 · Express · Prisma · React · Tailwind</p>
      </div>
    </div>
  );
};

/***************************************
 * src/pages/Dashboard.tsx (placeholder)
 ***************************************/
const Dashboard: React.FC = () => {
  const { role, clubId, logout } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => { api.get("/events").then(r => setEvents(r.data)); }, []);
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-white">Sign out</button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50">
            <h2 className="font-semibold mb-2">Session</h2>
            <p className="text-sm text-gray-400">Role: <span className="text-gray-200">{role ?? "(none)"}</span></p>
            <p className="text-sm text-gray-400">Club: <span className="text-gray-200">{clubId ?? "(none)"}</span></p>
          </div>
          <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50">
            <h2 className="font-semibold mb-2">Events</h2>
            <ul className="text-sm text-gray-300 list-disc pl-5">
              {events.map(ev => (
                <li key={ev.id}>{ev.name} — {new Date(ev.startDate).toLocaleDateString()}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/***************************************
 * src/App.tsx — router + guard
 ***************************************/
const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  if (!role) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/signin" element={<SignInPage />} />
    <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
    <Route path="*" element={<Navigate to="/signin" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
