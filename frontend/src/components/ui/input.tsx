import * as React from "react";
import {cn} from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({className, type = "text", ...props}, ref) => {
    return (
      <input
        className={cn(
          "w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[color:color-mix(in_srgb,var(--accent)_40%,var(--border))] focus:ring-4 focus:ring-[var(--ring)]",
          className,
        )}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

