import * as React from "react";
import {cva, type VariantProps} from "class-variance-authority";
import {cn} from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl border text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_12px_30px_rgba(15,111,221,0.2)] hover:brightness-[1.04] focus-visible:ring-[var(--ring)]",
        secondary:
          "border-[var(--border)] bg-[var(--panel-strong)] text-[var(--foreground)] hover:bg-[color:color-mix(in_srgb,var(--panel-strong)_86%,white)] focus-visible:ring-[var(--ring)]",
        ghost:
          "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_74%,transparent)] text-[var(--foreground)] hover:bg-[color:color-mix(in_srgb,var(--panel)_92%,transparent)] focus-visible:ring-[var(--ring)]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({className, size, variant, ...props}, ref) => {
    return <button className={cn(buttonVariants({variant, size, className}))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

