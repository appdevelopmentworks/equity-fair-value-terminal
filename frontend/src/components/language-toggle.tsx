"use client";

import {Languages} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {cn} from "@/lib/utils";

const LOCALE_OPTIONS = [
  {id: "en", labelKey: "en"},
  {id: "ja", labelKey: "ja"},
] as const;

export function LanguageToggle() {
  const {copy, locale, setLocale} = useI18n();

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_92%,transparent)] px-2 py-1 shadow-sm">
      <div className="flex items-center gap-2 px-2 text-sm text-[var(--muted-foreground)]">
        <Languages className="h-4 w-4 text-[var(--accent)]" />
        <span className="hidden sm:inline">{copy.language.label}</span>
      </div>
      <div className="flex items-center gap-1 rounded-xl bg-[color:color-mix(in_srgb,var(--panel-strong)_94%,transparent)] p-1">
        {LOCALE_OPTIONS.map((option) => {
          const isSelected = locale === option.id;

          return (
            <button
              aria-label={`${copy.language.label}: ${copy.language[option.labelKey]}`}
              aria-pressed={isSelected}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isSelected
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_8px_20px_rgba(15,111,221,0.18)]"
                  : "text-[var(--muted-foreground)] hover:bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] hover:text-[var(--foreground)]",
              )}
              key={option.id}
              onClick={() => setLocale(option.id)}
              type="button"
            >
              {copy.language[option.labelKey]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
