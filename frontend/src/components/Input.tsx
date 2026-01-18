import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/***************************************
 * src/components/Input.tsx (mobile-optimized UI helpers)
 ***************************************/
type LabelProps = { htmlFor?: string; children: ReactNode; required?: boolean };

export const Label = ({ htmlFor, children, required }: LabelProps) => (
  <label htmlFor={htmlFor} className="block text-sm md:text-sm font-medium text-gray-200 mb-1.5">
    {children}
    {required ? <span className="text-red-400 ml-0.5">*</span> : null}
  </label>
);

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={[
      "w-full rounded-lg bg-gray-800/60 border border-gray-700",
      "px-4 py-3 md:px-3 md:py-2",
      "text-base md:text-sm text-gray-100",
      "placeholder:text-gray-400",
      "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
      "transition-colors"
    ].join(" ")}
  />
);

export const Button = ({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={[
      "w-full rounded-lg bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600",
      "text-black font-semibold",
      "text-base md:text-sm",
      "py-3 md:py-2.5",
      "transition-all",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "touch-target",
      className || ""
    ].join(" ")}
  >
    {children}
  </button>
);

export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={[
      "w-full rounded-lg bg-gray-800/60 border border-gray-700",
      "px-4 py-3 md:px-3 md:py-2",
      "text-base md:text-sm text-gray-100",
      "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
      "transition-colors",
      "appearance-none",
      "bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2224%22%20height%3d%2224%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%222%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')]",
      "bg-[length:20px] bg-[right_12px_center] bg-no-repeat",
      "pr-10"
    ].join(" ")}
  />
);

export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={[
      "w-full rounded-lg bg-gray-800/60 border border-gray-700",
      "px-4 py-3 md:px-3 md:py-2",
      "text-base md:text-sm text-gray-100",
      "placeholder:text-gray-400",
      "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
      "transition-colors",
      "min-h-[100px]"
    ].join(" ")}
  />
);

// Mobile-friendly action button (for table actions, etc.)
type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "secondary";
};

export const ActionButton = ({ children, variant = "primary", className, ...props }: ActionButtonProps) => {
  const variantClasses = {
    primary: "bg-cyan-600/80 hover:bg-cyan-600 active:bg-cyan-700 text-black",
    danger: "bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-white",
    secondary: "bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-gray-100",
  };

  return (
    <button
      {...props}
      className={[
        "rounded-md font-semibold",
        "px-4 py-2.5 md:px-3 md:py-1.5",
        "text-sm",
        "transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "min-h-[44px] md:min-h-0",
        variantClasses[variant],
        className || ""
      ].join(" ")}
    >
      {children}
    </button>
  );
};
