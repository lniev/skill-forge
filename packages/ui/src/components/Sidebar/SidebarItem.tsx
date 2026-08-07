import { cn } from "../../lib/utils"
import type { SidebarItem } from "./types"
import { SidebarBadgeComponent } from "./SidebarBadge"
import { ChevronIcon } from "./icons"

interface SidebarItemComponentProps {
  item: SidebarItem
  depth: number
  activeItem?: string
  expanded: Set<string>
  onToggle: (id: string) => void
  onItemClick?: (item: SidebarItem) => void
  collapsed?: boolean
}

export function SidebarItemComponent({
  item,
  depth,
  activeItem,
  expanded,
  onToggle,
  onItemClick,
  collapsed,
}: SidebarItemComponentProps) {
  const isExpanded = expanded.has(item.id)
  const isActive = item.id === activeItem
  const hasChildren = item.children && item.children.length > 0

  const handleClick = () => {
    if (hasChildren) {
      onToggle(item.id)
    }
    item.onClick?.()
    onItemClick?.(item)
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "group flex w-full items-center gap-2 rounded-lg text-sm transition-colors",
          collapsed
            ? "justify-center py-1.5"
            : "px-3 py-1.5",
          isActive
            ? "bg-secondary font-medium text-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foregground",
          depth > 0 && !collapsed && "ml-4"
        )}
      >
        {(item.icon || collapsed) && (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-zinc-500 group-hover:text-zinc-700">
            {item.icon ?? item.label.charAt(0).toUpperCase()}
          </span>
        )}
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && <SidebarBadgeComponent badge={item.badge} />}
            {hasChildren && (
              <ChevronIcon
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            )}
          </>
        )}
      </button>
      {!collapsed && hasChildren && isExpanded && (
        <div className="mt-1 flex flex-col gap-0.5">
          {item.children?.map((child) => (
            <SidebarItemComponent
              key={child.id}
              item={child}
              depth={depth + 1}
              activeItem={activeItem}
              expanded={expanded}
              onToggle={onToggle}
              onItemClick={onItemClick}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  )
}
