import { cn } from "../../lib/utils"

interface SidebarHeaderProps {
  title?: string
  logo?: React.ReactNode
  beta?: boolean
  betaText?: string
  collapsed: boolean
  onExpand: () => void
}

export function SidebarHeader({
  title,
  logo,
  beta = false,
  betaText = "beta",
  collapsed,
  onExpand,
}: SidebarHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col">
      {/* Top drag-bar row. 给 macOS 窗口留空，避免覆盖红绿灯。 */}
      <div
        className="flex h-10 items-center justify-end px-2"
        data-tauri-drag-region
      />

      {/* Logo / title row */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center transition-none",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {logo && (
          <button
            type="button"
            onClick={onExpand}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-primary-foreground",
              !collapsed && "pointer-events-none"
            )}
          >
            <span className="flex h-4 w-4 items-center justify-center">{logo}</span>
          </button>
        )}
        {!collapsed && (
          <div className="flex min-w-0 flex-1 items-center gap-2 pl-2.5">
            {title && (
              <span className="truncate text-sm font-semibold text-zinc-900">
                {title}
              </span>
            )}
            {beta && (
              <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {betaText}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
