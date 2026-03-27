"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type DatasetOptionCardProps = {
  title: string;
  subtitle: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  icon: LucideIcon;
};

export function DatasetOptionCard({
  title,
  subtitle,
  checked,
  onCheckedChange,
  disabled,
  icon: Icon,
}: DatasetOptionCardProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[7.5rem] flex-col rounded-2xl border p-3 transition-colors sm:min-h-[6.75rem]",
        "border-border/80 bg-card/80 shadow-sm",
        checked && "border-[#34C759]/40 bg-[#0f1a12]/90 ring-1 ring-[#34C759]/25",
        disabled && "opacity-55"
      )}
    >
      <div className="grid h-full min-h-0 grid-cols-[1fr_auto] grid-rows-[auto_minmax(0,1fr)] gap-x-2 gap-y-1">
        <h3 className="min-w-0 font-display text-sm font-semibold leading-tight tracking-tight text-foreground sm:text-base">
          {title}
        </h3>
        <div
          className={cn(
            "row-span-2 flex h-full w-10 shrink-0 flex-col items-center justify-between gap-2 self-stretch pt-0.5",
            "sm:w-11"
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10",
              checked ? "bg-[#34C759]/20 text-[#34C759]" : "bg-muted text-muted-foreground"
            )}
            aria-hidden
          >
            <Icon className="h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem]" strokeWidth={1.75} />
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={checked ? `Desativar ${title}` : `Ativar ${title}`}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onCheckedChange(!checked);
            }}
            className={cn(
              "relative mt-auto h-8 w-[3.25rem] shrink-0 rounded-full transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34C759]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              checked ? "bg-[#34C759]" : "bg-muted-foreground/35",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <span
              className={cn(
                "pointer-events-none absolute top-0.5 left-0.5 h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-200 ease-out will-change-transform",
                checked && "translate-x-[1.35rem]"
              )}
            />
          </button>
        </div>
        <p className="min-w-0 text-xs leading-snug text-muted-foreground line-clamp-3 sm:line-clamp-2">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
