import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react"

import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [devToken, setDevToken] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data } = await api.post("/auth/password-reset-request", { email })
      setSuccess(true)
      if (data.devToken) setDevToken(data.devToken)
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to send reset link")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl tracking-wider leading-none">
            GOJU KAI <span className="text-primary">NAMIBIA</span>
          </h1>
        </div>

        <Card>
          {success ? (
            <>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <div className="flex size-12 items-center justify-center rounded-full bg-belt-green/15 text-belt-green">
                    <CheckCircle2 className="size-6" />
                  </div>
                </div>
                <CardTitle className="text-center">Check your email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  If an account exists for <span className="text-foreground">{email}</span>,
                  we've sent a password-reset link to that address.
                </p>

                {devToken && (
                  <div className="rounded-md border border-belt-yellow/30 bg-belt-yellow/5 p-3 space-y-2">
                    <p className="text-xs font-semibold text-belt-yellow">
                      Development mode
                    </p>
                    <p className="text-xs text-muted-foreground break-all">
                      Token: {devToken}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/reset-password?token=${devToken}`)}
                    >
                      Go to reset page
                    </Button>
                  </div>
                )}

                <Button onClick={() => navigate("/signin")} className="w-full" size="lg">
                  Back to sign in
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Forgot password?</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email and we'll send a reset link.
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
                    <Label htmlFor="email" className="mb-1.5">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoFocus
                      autoComplete="email"
                      autoCapitalize="none"
                      inputMode="email"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? "Sending..." : "Send reset link"}
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
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
