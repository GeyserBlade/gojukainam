import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { AlertCircle, Loader2 } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function MagicLoginPage() {
  const [params] = useSearchParams()
  const token = params.get("token")
  const { verifyMagicLink } = useAuth()
  const nav = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError("No token provided")
      return
    }
    verifyMagicLink(token)
      .then(() => nav("/dashboard"))
      .catch((err) => {
        console.error(err)
        setError("Invalid or expired token")
      })
  }, [token, verifyMagicLink, nav])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl tracking-wider leading-none">
            GOJU KAI <span className="text-primary">NAMIBIA</span>
          </h1>
        </div>

        <Card>
          <CardContent className="py-10 text-center">
            {error ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                    <AlertCircle className="size-6" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Login failed</h2>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <Button onClick={() => nav("/signin")} variant="outline">
                  Back to sign in
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-sm">Verifying magic link…</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
