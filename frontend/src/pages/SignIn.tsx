import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, Role } from "../contexts/AuthContext";
import { Button } from "../components/Input";
import { Input } from "../components/Input";
import { Label } from "../components/Input";
import { Select } from "../components/Input";

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

export default SignInPage;
// Removed custom useNavigate implementation; using react-router-dom's useNavigate instead.

