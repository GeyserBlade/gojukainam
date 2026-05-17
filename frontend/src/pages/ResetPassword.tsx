import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AlertCircle, ArrowLeft } from "lucide-react"

import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const STRENGTH_LABELS = [
  { label: "Very weak", color: "text-destructive", bar: "bg-destructive" },
  { label: "Weak", color: "text-belt-orange", bar: "bg-belt-orange" },
  { label: "Fair", color: "text-belt-yellow", bar: "bg-belt-yellow" },
  { label: "Good", color: "text-belt-green", bar: "bg-belt-green" },
  { label: "Strong", color: "text-belt-green", bar: "bg-belt-green" },
]

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState(0)

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token")
  }, [token])

  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0)
      return
    }
    let score = 0
    if (newPassword.length >= 8) score++
    if (newPassword.length >= 12) score++
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++
    if (/[0-9]/.test(newPassword)) score++
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) score++
    setPasswordStrength(Math.min(score, 4))
  }, [newPassword])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError("Invalid or missing reset token")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      await api.post("/auth/password-reset", { token, newPassword })
      navigate("/signin", {
        state: { message: "Password reset successfully! You can now sign in." },
      })
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  const strength = STRENGTH_LABELS[passwordStrength]
  const barWidth = ["w-0", "w-1/4", "w-2/4", "w-3/4", "w-full"][passwordStrength]

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl tracking-wider leading-none">
            GOJU KAI <span className="text-primary">NAMIBIA</span>
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your new password below.
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3"
              >
                <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="mb-1.5">
                  New password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoFocus
                  autoComplete="new-password"
                />
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            barWidth,
                            passwordStrength > 0 && strength.bar,
                          )}
                        />
                      </div>
                      {passwordStrength > 0 && (
                        <span className={cn("text-xs font-medium", strength.color)}>
                          {strength.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use uppercase, lowercase, number, and special character.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="mb-1.5">
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !token}
                className="w-full"
                size="lg"
              >
                {loading ? "Resetting..." : "Reset password"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate("/signin")}
                className="w-full"
              >
                <ArrowLeft />
                Back to sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResetPasswordPage
