import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/***************************************
 * src/components/Input.tsx (tiny UI helpers)
 ***************************************/
type LabelProps = { htmlFor?: string; children: ReactNode; required?: boolean };

export const Label = ({ htmlFor, children, required }: LabelProps) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-200 mb-1">
    {children}
    {required ? <span className="text-red-400 ml-0.5">*</span> : null}
  </label>
);

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={[
      "w-full rounded-lg bg-gray-800/60 border border-gray-700 px-3 py-1.5 text-sm text-gray-100",
      "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
    ].join(" ")}
  />
);

export const Button = ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className="w-full rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm py-2 transition disabled:opacity-50"
  >
    {children}
  </button>
);

export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className="w-full rounded-lg bg-gray-800/60 border border-gray-700 px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
  />
);

export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className="w-full rounded-lg bg-gray-800/60 border border-gray-700 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
  />
);
