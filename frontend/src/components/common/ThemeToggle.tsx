"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`h-9 w-9 rounded-md bg-[var(--surface-raised)] border border-[var(--border)] ${className || ""}`} />
    );
  }

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={className}
      aria-label={`Toggle theme (currently ${theme})`}
      title={`Current theme: ${theme}. Click to switch.`}
    >
      {theme === "dark" && <Moon className="h-4 w-4 text-[var(--foreground)]" />}
      {theme === "light" && <Sun className="h-4 w-4 text-amber-500" />}
      {theme === "system" && <Laptop className="h-4 w-4 text-[var(--text-muted)]" />}
    </Button>
  );
}
