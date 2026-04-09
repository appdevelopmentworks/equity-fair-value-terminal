import type {ReactNode} from "react";
import {cn} from "@/lib/utils";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_92%,transparent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
