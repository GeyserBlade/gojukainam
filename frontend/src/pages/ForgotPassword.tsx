import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Label } from "../components/Input";
import { api } from "../lib/api";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await api.post("/auth/password-reset-request", { email });
      setSuccess(true);
      if (data.devToken) {
        setDevToken(data.devToken);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold mb-2">Check Your Email</h1>
              <p className="text-sm text-gray-400">
                If an account exists for {email}, we've sent a password reset link to that email address.
              </p>
            </div>

            {devToken && (
              <div className="mb-6 p-4 rounded-lg bg-yellow-600/10 border border-yellow-600/20">
                <p className="text-xs text-yellow-400 mb-2 font-semibold">Development Mode</p>
                <p className="text-xs text-gray-400 mb-2">Token: {devToken}</p>
                <button
                  onClick={() => navigate(`/reset-password?token=${devToken}`)}
                  className="text-xs px-3 py-1.5 rounded bg-yellow-600/80 hover:bg-yellow-600 text-black font-semibold"
                >
                  Go to Reset Page
                </button>
              </div>
            )}

            <div className="space-y-3">
              <Button onClick={() => navigate("/signin")} className="w-full">
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold mb-2">Forgot Password?</h1>
            <p className="text-sm text-gray-400">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-600/10 border border-red-600/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label required>Email Address</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/signin")}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
