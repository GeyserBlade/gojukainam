import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input, Label } from "../components/Input";
import { api } from "../lib/api";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
    }
  }, [token]);

  // Calculate password strength
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }

    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) score++;

    setPasswordStrength(Math.min(score, 4));
  }, [newPassword]);

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 0: return { label: "Very Weak", color: "text-red-400" };
      case 1: return { label: "Weak", color: "text-orange-400" };
      case 2: return { label: "Fair", color: "text-yellow-400" };
      case 3: return { label: "Good", color: "text-green-400" };
      case 4: return { label: "Strong", color: "text-green-500" };
      default: return { label: "", color: "" };
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/password-reset", {
        token,
        newPassword
      });

      // Success - redirect to sign in
      navigate("/signin", {
        state: { message: "Password reset successfully! You can now sign in with your new password." }
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  const strength = getStrengthLabel();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold mb-2">Reset Your Password</h1>
            <p className="text-sm text-gray-400">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-600/10 border border-red-600/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label required>New Password</Label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoFocus
              />
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength === 0 ? "w-0" :
                          passwordStrength === 1 ? "w-1/4 bg-red-500" :
                          passwordStrength === 2 ? "w-1/2 bg-orange-500" :
                          passwordStrength === 3 ? "w-3/4 bg-yellow-500" :
                          "w-full bg-green-500"
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${strength.color}`}>
                      {strength.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Password must contain: uppercase, lowercase, number, and special character
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label required>Confirm Password</Label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button type="submit" disabled={loading || !token} className="w-full">
              {loading ? "Resetting..." : "Reset Password"}
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

export default ResetPasswordPage;
