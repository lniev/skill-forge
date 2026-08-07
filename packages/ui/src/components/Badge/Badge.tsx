import { cn } from "../../lib/utils"
import type { BadgeProps } from "./types"

export function Badge({ label, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-none tracking-tight",
        variant === "default" && "bg-geist-surface-secondary text-geist-text shadow-geist-border",
        variant === "secondary" && "bg-geist-surface-secondary text-geist-text-muted shadow-geist-border",
        variant === "outline" && "border border-geist-border bg-geist-surface text-geist-text-muted",
        variant === "primary" && "bg-geist-badge-blue-bg text-geist-badge-blue-text",
        variant === "destructive" && "bg-geist-error-bg text-geist-error",
        variant === "pro" && "bg-violet-100/80 text-violet-700",
        variant === "new" && "bg-emerald-100/80 text-emerald-700",
        variant === "alpha" && "bg-blue-100/80 text-blue-700",
        className
      )}
    >
      {label}
    </span>
  )
}
