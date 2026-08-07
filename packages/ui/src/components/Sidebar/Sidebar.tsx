import * as React from "react"
import { cn } from "../../lib/utils"
import type { SidebarProps } from "./types"
import { SidebarHeader } from "./SidebarHeader"
import { SidebarItemComponent } from "./SidebarItem"

export function Sidebar({
  title,
  logo,
  beta = false,
  betaText = "beta",
  sections,
  activeItem,
  onItemClick,
  className,
  collapsed: collapsedProp,
  onCollapsedChange,
  footer,
}: SidebarProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())
  const [internalCollapsed, setInternalCollapsed] = React.useState(false)

  const isControlled = collapsedProp !== undefined
  const collapsed = isControlled ? collapsedProp : internalCollapsed

  const setCollapsed = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setInternalCollapsed(value)
      }
      onCollapsedChange?.(value)
    },
    [isControlled, onCollapsedChange]
  )

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col overflow-hidden border-r border-border bg-card/80 backdrop-blur-xl transition-[width]",
        collapsed ? "w-16" : "w-72",
        className
      )}
    >
      <SidebarHeader
        title={title}
        logo={logo}
        beta={beta}
        betaText={betaText}
        collapsed={collapsed}
        onExpand={() => setCollapsed(false)}
      />

      <div className="flex flex-1 flex-col gap-6 overflow-auto py-4 px-3">
        {sections.map((section, sectionIndex) => (
          <div key={section.title ?? `section-${sectionIndex}`} className="flex flex-col gap-1">
            {section.title && (
              <div className="flex h-5 items-center px-3">
                {collapsed ? (
                  <div className="h-px w-full bg-zinc-200" />
                ) : (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    {section.title}
                  </span>
                )}
              </div>
            )}
            {section.items.map((item) => (
              <SidebarItemComponent
                key={item.id}
                item={item}
                depth={0}
                activeItem={activeItem}
                expanded={expanded}
                onToggle={toggleExpand}
                onItemClick={onItemClick}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </div>
      {footer && (
        <div className="border-t border-zinc-100 p-3">{footer}</div>
      )}
    </aside>
  )
}
