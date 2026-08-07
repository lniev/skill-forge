import { cn } from "../../lib/utils"
import type { SidebarBadge as SidebarBadgeType } from "./types"

export function SidebarBadgeComponent({ badge }: { badge: SidebarBadgeType }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-medium leading-none",
        badge.variant === "default" && "bg-zinc-100 text-zinc-600",
        badge.variant === "secondary" && "bg-zinc-100 text-zinc-600",
        badge.variant === "outline" && "border border-zinc-200 text-zinc-500",
        badge.variant === "pro" && "bg-violet-100 text-violet-700",
        badge.variant === "new" && "bg-emerald-50 text-emerald-600",
        badge.variant === "alpha" && "bg-blue-50 text-blue-600",
        !badge.variant && "bg-zinc-100 text-zinc-600"
      )}
    >
      {badge.label}
    </span>
  )
}
