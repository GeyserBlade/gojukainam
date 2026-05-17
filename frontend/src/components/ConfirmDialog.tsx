import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ConfirmOptions = {
  title?: string
  description?: ReactNode
  confirmText?: string
  cancelText?: string
  /** When true, renders the confirm button in destructive style. Default: false. */
  destructive?: boolean
}

type ConfirmContextValue = (opts?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

interface PendingState {
  options: ConfirmOptions
  resolve: (value: boolean) => void
}

const DEFAULTS: Required<Omit<ConfirmOptions, "description">> = {
  title: "Are you sure?",
  confirmText: "Confirm",
  cancelText: "Cancel",
  destructive: false,
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null)
  // Track if we've already resolved so onOpenChange(false) doesn't double-fire.
  const resolvedRef = useRef(false)

  const confirm = useCallback<ConfirmContextValue>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolvedRef.current = false
      setPending({ options: opts ?? {}, resolve })
    })
  }, [])

  const resolveWith = useCallback(
    (value: boolean) => {
      if (resolvedRef.current) return
      resolvedRef.current = true
      pending?.resolve(value)
      setPending(null)
    },
    [pending],
  )

  const opts = pending?.options ?? {}
  const open = pending !== null

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(o) => {
          if (!o) resolveWith(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{opts.title ?? DEFAULTS.title}</AlertDialogTitle>
            {opts.description && (
              <AlertDialogDescription>{opts.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => resolveWith(false)}>
              {opts.cancelText ?? DEFAULTS.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resolveWith(true)}
              className={cn(
                opts.destructive &&
                  buttonVariants({ variant: "destructive" }),
              )}
            >
              {opts.confirmText ?? DEFAULTS.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx)
    throw new Error("useConfirm must be used within <ConfirmProvider>")
  return ctx
}

export function useConfirmValue() {
  return useMemo(() => useContext(ConfirmContext), [])
}
