import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertCircle, LogIn } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useApiErrorToast } from "@/components/Toast"
import { FieldError } from "@/components/FieldError"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type FormValues = z.infer<typeof schema>

export const SignInPage = () => {
  const { login } = useAuth()
  const nav = useNavigate()
  const showApiError = useApiErrorToast()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password)
      nav("/dashboard")
    } catch (err) {
      showApiError(err, "Login failed")
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error)?.message ??
        "Login failed"
      setError("root", { message })
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl tracking-wider leading-none">
            GOJU KAI <span className="text-primary">NAMIBIA</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-3">
            Karate Championships Admin
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="email" className="mb-1.5">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
                <FieldError id="email-error">{errors.email?.message}</FieldError>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => nav("/forgot-password")}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <FieldError id="password-error">{errors.password?.message}</FieldError>
              </div>

              {errors.root?.message && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3"
                >
                  <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{errors.root.message}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                <LogIn />
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          v{__APP_VERSION__}
        </p>
      </div>
    </div>
  )
}

export default SignInPage
