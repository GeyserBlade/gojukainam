import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input, Label } from "../components/Input";
import { FieldError } from "../components/FieldError";
import { useApiErrorToast } from "../components/Toast";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export const SignInPage = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const showApiError = useApiErrorToast();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password);
      nav("/dashboard");
    } catch (err) {
      showApiError(err, "Login failed");
      setError("root", { message: (err as any)?.response?.data?.error || (err as any)?.message || "Login failed" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-gray-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 md:mb-6">
            <h1 className="text-3xl md:text-2xl font-bold mb-2">Gojukai Namibia</h1>
            <p className="text-sm text-gray-400">Karate Championships Admin</p>
          </div>

          <div className="bg-gray-900/60 backdrop-blur rounded-2xl md:rounded-3xl border border-gray-800 shadow-2xl p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-6">Sign in</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <Label htmlFor="email" required>Email</Label>
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
                <Label htmlFor="password" required>Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <FieldError id="password-error">{errors.password?.message}</FieldError>
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

              {errors.root?.message && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3" role="alert">
                  <p className="text-red-400 text-sm">{errors.root.message}</p>
                </div>
              )}

              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="py-4 text-center">
        <p className="text-xs text-gray-600">v0.1</p>
      </div>
    </div>
  );
};

export default SignInPage;
