"use client";

import {Card, CardContent} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {useI18n} from "@/lib/i18n";

export function LoadingPanel() {
  const {copy} = useI18n();

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--foreground)]">{copy.loadingPanel.title}</p>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {copy.loadingPanel.description}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-10 w-72 max-w-full" />
      </CardContent>
    </Card>
  );
}
