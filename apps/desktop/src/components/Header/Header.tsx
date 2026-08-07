import { cn } from "@skill-platform/ui/lib/utils"
import { Header as UIHeader } from "@skill-platform/ui"
import { useTranslation } from "react-i18next"
import { useHeaderStore } from "../../store/headerStore"
import { useSidebar } from "../Layout/SidebarContext"

function PanelLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  )
}

export function Header() {
  const { t } = useTranslation()
  const { left, center, right } = useHeaderStore()
  const { collapsed, setCollapsed } = useSidebar()

  return (
    <UIHeader
      left={
        <div className="flex flex-1 items-center gap-2" data-tauri-drag-region>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-geist-text-muted transition-colors hover:bg-geist-surface-secondary hover:text-geist-text"
            data-tauri-drag-region="no-drag"
            aria-label={collapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
            title={collapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
          >
            <PanelLeftIcon
              className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            />
          </button>
          {left}
        </div>
      }
      center={center}
      right={right}
      className="shrink-0"
      data-tauri-drag-region
    />
  )
}

export default Header
