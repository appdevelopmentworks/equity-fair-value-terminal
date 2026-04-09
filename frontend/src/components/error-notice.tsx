"use client";

import {AlertCircle, RotateCcw} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {getUserFacingErrorCopy} from "@/lib/error-messages";
import {useI18n} from "@/lib/i18n";
import type {BridgeErrorResponse} from "@/types/quote";

type ErrorNoticeProps = {
  error: BridgeErrorResponse;
  onRetry?: () => void;
};

export function ErrorNotice({error, onRetry}: ErrorNoticeProps) {
  const {copy, locale} = useI18n();
  const errorCopy = getUserFacingErrorCopy(error, locale);

  return (
    <Card className="border-[color:color-mix(in_srgb,var(--danger)_28%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_92%,transparent)]">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-full bg-[color:color-mix(in_srgb,var(--danger)_14%,transparent)] p-2 text-[var(--danger)]">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{errorCopy.title}</p>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">{errorCopy.description}</p>
          </div>
        </div>
        {onRetry ? (
          <Button className="self-start" onClick={onRetry} type="button" variant="secondary">
            <RotateCcw className="h-4 w-4" />
            {copy.common.retrySearch}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
