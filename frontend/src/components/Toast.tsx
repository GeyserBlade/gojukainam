import { useCallback, useMemo, type ReactNode } from "react"
import { toast } from "sonner"

import { Toaster } from "@/components/ui/sonner"

/**
 * Phase-2 shim — routes the legacy Toast API through Sonner. The old
 * <ToastProvider> wrapper still works (it just mounts the Sonner Toaster).
 *
 * Existing call sites using `useToast().success(...)` / `.error(...)` / `.info(...)`
 * keep working unchanged. New code should import `toast` from `sonner` directly.
 */

type ToastKind = "success" | "error" | "info"

type ToastContextValue = {
  show: (message: string, kind?: ToastKind) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const dispatch = (message: string, kind: ToastKind) => {
  if (kind === "success") toast.success(message)
  else if (kind === "error") toast.error(message)
  else toast(message)
}

export const useToast = (): ToastContextValue =>
  useMemo<ToastContextValue>(
    () => ({
      show: (message, kind = "info") => dispatch(message, kind),
      success: (message) => dispatch(message, "success"),
      error: (message) => dispatch(message, "error"),
      info: (message) => dispatch(message, "info"),
    }),
    [],
  )

export const ToastProvider = ({ children }: { children: ReactNode }) => (
  <>
    {children}
    <Toaster richColors closeButton position="top-right" />
  </>
)

export const useApiErrorToast = () => {
  const { error } = useToast()
  return useCallback(
    (err: unknown, fallback = "Something went wrong") => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (err as { message?: string })?.message ||
        fallback
      error(typeof msg === "string" ? msg : fallback)
    },
    [error],
  )
}

// Re-export the raw sonner toast for new call sites.
export { toast }
