import {cn} from "@/lib/utils";

export function Skeleton({className}: {className?: string}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[color:color-mix(in_srgb,var(--muted)_16%,transparent)]",
        className,
      )}
    />
  );
}

