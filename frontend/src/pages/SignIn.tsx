import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/Input";
import { Input } from "../components/Input";
import { Label } from "../components/Input";

/***************************************
 * src/pages/SignIn.tsx (mobile-optimized)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-gray-100 flex flex-col">
      {/* Center content vertically and horizontally */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo/Title area - larger on mobile */}
          <div className="text-center mb-8 md:mb-6">
            <h1 className="text-3xl md:text-2xl font-bold mb-2">Gojukai Namibia</h1>
            <p className="text-sm text-gray-400">Karate Championships Admin</p>
          </div>

          {/* Sign in card */}
          <div className="bg-gray-900/60 backdrop-blur rounded-2xl md:rounded-3xl border border-gray-800 shadow-2xl p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-6">Sign in</h2>

            <form onSubmit={onPasswordSignIn} className="space-y-5">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => nav("/forgot-password")}
                    className="text-sm text-cyan-400 hover:text-cyan-300 active:text-cyan-500 py-1"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button disabled={sending} type="submit">
                {sending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer - fixed at bottom on mobile */}
      <div className="py-4 text-center">
        <p className="text-xs text-gray-600">v0.1</p>
      </div>
    </div>
  );
};

export default SignInPage;