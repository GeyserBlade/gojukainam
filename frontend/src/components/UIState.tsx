import type { ReactNode } from "react";

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div
    aria-hidden
    className={`animate-pulse rounded-md bg-gray-800/70 ${className}`}
  />
);

export const SkeletonLine = ({ width = "w-full" }: { width?: string }) => (
  <Skeleton className={`h-4 ${width}`} />
);

export const SkeletonListItem = () => (
  <div className="py-3 px-4 md:px-0 flex items-start justify-between gap-3">
    <div className="min-w-0 flex-1 space-y-2">
      <SkeletonLine width="w-1/3" />
      <SkeletonLine width="w-1/2" />
      <SkeletonLine width="w-2/5" />
    </div>
    <Skeleton className="h-10 w-20 rounded-md" />
  </div>
);

export const SkeletonList = ({ count = 5 }: { count?: number }) => (
  <ul className="divide-y divide-gray-800 -mx-4 md:mx-0" aria-label="Loading">
    {Array.from({ length: count }).map((_, i) => (
      <li key={i}>
        <SkeletonListItem />
      </li>
    ))}
  </ul>
);

export const Spinner = ({ size = 20, label = "Loading" }: { size?: number; label?: string }) => (
  <span role="status" aria-label={label} className="inline-flex items-center">
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="animate-spin text-cyan-400"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
    <span className="sr-only">{label}</span>
  </span>
);

export const PageSpinner = ({ label = "Loading" }: { label?: string }) => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="flex items-center gap-3 text-gray-400">
      <Spinner size={24} label={label} />
      <span className="text-sm">{label}…</span>
    </div>
  </div>
);

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export const EmptyState = ({ icon = "📭", title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4">
    <div className="text-4xl mb-3" aria-hidden>{icon}</div>
    <h3 className="text-base font-semibold text-gray-200">{title}</h3>
    {description && <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export const ErrorState = ({
  title = "Couldn't load data",
  message = "Please try again in a moment.",
  onRetry,
}: ErrorStateProps) => (
  <div
    role="alert"
    className="rounded-lg border border-red-900/60 bg-red-950/20 p-4 text-center"
  >
    <div className="text-2xl mb-2" aria-hidden>⚠️</div>
    <p className="font-semibold text-gray-100">{title}</p>
    <p className="text-sm text-gray-400 mt-1">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-3 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-sm"
      >
        Retry
      </button>
    )}
  </div>
);
