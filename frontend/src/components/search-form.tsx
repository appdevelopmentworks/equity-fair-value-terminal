"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {ChevronRight, LoaderCircle, Search} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useI18n} from "@/lib/i18n";
import {looksLikeTickerInput} from "@/lib/search-utils";
import {cn} from "@/lib/utils";
import type {SearchCandidate, SearchSuggestionState} from "@/types/search";

type SearchFormProps = {
  value: string;
  onChange: (nextValue: string) => void;
  onSubmit: () => void;
  onSelectCandidate: (candidate: SearchCandidate) => void;
  isLoading: boolean;
  suggestions: SearchCandidate[];
  suggestionsState: SearchSuggestionState;
  suggestionsMessage?: string | null;
};

function getCandidateTitle(candidate: SearchCandidate) {
  return candidate.longName ?? candidate.shortName ?? candidate.symbol;
}

export function SearchForm({
  value,
  onChange,
  onSubmit,
  onSelectCandidate,
  isLoading,
  suggestions,
  suggestionsState,
  suggestionsMessage,
}: SearchFormProps) {
  const {copy} = useI18n();
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trimmedValue = value.trim();

  const showDropdown = useMemo(() => {
    if (!isFocused || trimmedValue.length < 2) {
      return false;
    }

    return suggestionsState !== "idle";
  }, [isFocused, suggestionsState, trimmedValue.length]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [trimmedValue, suggestions]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) {
      if (event.key === "Escape") {
        setIsFocused(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (event.key === "Enter") {
      if (looksLikeTickerInput(trimmedValue)) {
        setIsFocused(false);
        return;
      }

      event.preventDefault();
      onSelectCandidate(suggestions[highlightedIndex] ?? suggestions[0]);
      setIsFocused(false);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsFocused(false);
    }
  }

  return (
    <div className="space-y-3" ref={rootRef}>
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="sr-only" htmlFor="ticker-search">
          {copy.search.inputLabel}
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            id="ticker-search"
            autoComplete="off"
            autoCorrect="off"
            className="h-14 pl-11 pr-12 text-base"
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={copy.search.placeholder}
            spellCheck={false}
            value={value}
          />
          {suggestionsState === "loading" && trimmedValue.length >= 2 ? (
            <LoaderCircle className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--muted-foreground)]" />
          ) : null}
        </div>
        <Button className="h-14 min-w-32" disabled={isLoading} type="submit">
          {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {isLoading ? copy.common.loading : copy.common.search}
        </Button>
      </form>

      {showDropdown ? (
        <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel-strong)_96%,transparent)] shadow-[var(--shadow)]">
          {suggestionsState === "loading" && suggestions.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-4 text-sm text-[var(--muted-foreground)]">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {copy.search.suggestionsLoading}
            </div>
          ) : null}

          {suggestionsState === "error" ? (
            <div className="px-4 py-4 text-sm leading-6 text-[var(--muted-foreground)]">
              {suggestionsMessage ?? copy.search.suggestionsUnavailable}
            </div>
          ) : null}

          {suggestionsState === "empty" ? (
            <div className="px-4 py-4 text-sm leading-6 text-[var(--muted-foreground)]">
              {suggestionsMessage ?? copy.search.suggestionsEmpty}
            </div>
          ) : null}

          {suggestions.length > 0 ? (
            <>
              <div className="max-h-[360px] overflow-y-auto py-2">
                {suggestions.map((candidate, index) => {
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <button
                      className={cn(
                        "flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition-colors",
                        isHighlighted
                          ? "bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)]"
                          : "hover:bg-[color:color-mix(in_srgb,var(--panel)_72%,transparent)]",
                      )}
                      disabled={isLoading}
                      key={`${candidate.symbol}-${candidate.exchange}`}
                      onClick={() => {
                        onSelectCandidate(candidate);
                        setIsFocused(false);
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      type="button"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="line-clamp-2 text-sm font-medium text-[var(--foreground)]">
                          {getCandidateTitle(candidate)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <span className="font-semibold tracking-[0.12em] text-[var(--foreground)]">
                            {candidate.symbol}
                          </span>
                          <span>{candidate.exchange}</span>
                          <span>{candidate.currency}</span>
                        </div>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)]" />
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
                {copy.search.suggestionsFooter}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
