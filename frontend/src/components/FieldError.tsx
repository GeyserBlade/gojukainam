import type { ReactNode } from "react";

type Props = { id?: string; children?: ReactNode };

export const FieldError = ({ id, children }: Props) => {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-red-400">
      {children}
    </p>
  );
};
