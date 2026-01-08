import { useState, type FormEvent } from "react";
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

export const SignInPage = () => {
  const { loginDev, login } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"dev" | "password">("password");
  
  // Dev State
  const [devRole, setDevRole] = useState<Role>("CLUB_MANAGER");
  const [devClubId, setDevClubId] = useState("");
  
  // Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDevSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await loginDev({ role: devRole, clubId: devClubId || undefined });
      nav("/dashboard");
    } catch (e) { setError("Dev login failed"); }
  }

  async function onPasswordSignIn(e: FormEvent) {
      e.preventDefault();
      setError(null); setSending(true);
      try {
          await login(email, password);
          nav("/dashboard");
      } catch (err: any) {
          console.error(err);
          setError(err?.response?.data?.error || err?.message || "Login failed");
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
            <button onClick={() => setMode("password")} className={`flex-1 rounded-xl px-2 py-2 text-sm border ${mode === "password" ? "bg-cyan-500 text-black border-cyan-400" : "border-gray-700 hover:bg-gray-800"}`}>Password</button>
            <button onClick={() => setMode("dev")} className={`flex-1 rounded-xl px-2 py-2 text-sm border ${mode === "dev" ? "bg-cyan-500 text-black border-cyan-400" : "border-gray-700 hover:bg-gray-800"}`}>Dev</button>
          </div>

          {mode === "dev" && (
            <form onSubmit={onDevSignIn} className="space-y-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select id="role" value={devRole} onChange={(e) => setDevRole(e.target.value as Role)}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="club">Club ID (optional)</Label>
                <Input id="club" placeholder="e.g. clb_xxx" value={devClubId} onChange={(e)=>setDevClubId(e.target.value)} />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit">Continue</Button>
            </form>
          )}

          {mode === "password" && (
             <form onSubmit={onPasswordSignIn} className="space-y-4">
               <div>
                 <Label htmlFor="email">Email</Label>
                 <Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
               </div>
               <div>
                 <Label htmlFor="password">Password</Label>
                 <Input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                 <div className="mt-1 text-right">
                   <button
                     type="button"
                     onClick={() => nav("/forgot-password")}
                     className="text-xs text-cyan-400 hover:text-cyan-300"
                   >
                     Forgot password?
                   </button>
                 </div>
               </div>
               {error && <p className="text-red-400 text-sm">{error}</p>}
               <Button disabled={sending} type="submit">{sending ? "Signing in..." : "Sign in"}</Button>
             </form>
          )}
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">v0.1 · Express · Prisma · React · Tailwind</p>
      </div>
    </div>
  );
};

export default SignInPage;