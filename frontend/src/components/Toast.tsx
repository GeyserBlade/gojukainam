import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type ToastContextValue = {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
};

const kindStyles: Record<ToastKind, { border: string; bg: string; icon: string; label: string }> = {
  success: { border: "border-green-600/40", bg: "bg-green-950/80", icon: "✓", label: "Success" },
  error:   { border: "border-red-600/40",   bg: "bg-red-950/80",   icon: "✕", label: "Error" },
  info:    { border: "border-cyan-600/40",  bg: "bg-cyan-950/80",  icon: "ℹ", label: "Info" },
};

const DEFAULT_TIMEOUT = 4000;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, kind, message }]);
    window.setTimeout(() => dismiss(id), DEFAULT_TIMEOUT);
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(() => ({
    show,
    success: (m) => show(m, "success"),
    error:   (m) => show(m, "error"),
    info:    (m) => show(m, "info"),
  }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed z-[100] bottom-4 right-4 left-4 md:left-auto md:max-w-sm flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const s = kindStyles[t.kind];
          return (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className={`pointer-events-auto rounded-lg border ${s.border} ${s.bg} backdrop-blur px-4 py-3 shadow-lg flex items-start gap-3 text-sm text-gray-100 animate-[fadeIn_0.15s_ease-out]`}
            >
              <span aria-hidden className="text-base leading-none mt-0.5">{s.icon}</span>
              <span className="sr-only">{s.label}: </span>
              <span className="flex-1 break-words">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-gray-400 hover:text-gray-100 leading-none px-1"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useApiErrorToast = () => {
  const { error } = useToast();
  return useCallback((err: unknown, fallback = "Something went wrong") => {
    const msg =
      (err as any)?.response?.data?.error ||
      (err as any)?.message ||
      fallback;
    error(typeof msg === "string" ? msg : fallback);
  }, [error]);
};

