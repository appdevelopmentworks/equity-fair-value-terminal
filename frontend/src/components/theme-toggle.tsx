"use client";

import {MoonStar, SunMedium} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";

type ThemeToggleProps = {
  theme: string;
  onToggle: () => void;
};

export function ThemeToggle({theme, onToggle}: ThemeToggleProps) {
  const isDark = theme === "dark";
  const {copy} = useI18n();

  return (
    <Button onClick={onToggle} type="button" variant="ghost">
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      {isDark ? copy.theme.light : copy.theme.dark}
    </Button>
  );
}
