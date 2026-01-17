import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/Input";
import { Input } from "../components/Input";
import { Label } from "../components/Input";

/***************************************
 * src/pages/SignIn.tsx
 ***************************************/

export const SignInPage = () => {
  const { login } = useAuth();
  const nav = useNavigate();

  // Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">v0.1 · Express · Prisma · React · Tailwind</p>
      </div>
    </div>
  );
};

export default SignInPage;