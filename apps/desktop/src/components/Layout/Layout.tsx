import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Outlet } from "react-router-dom"
import { cn } from "@skill-platform/ui/lib/utils"
import { Sidebar, SidebarSection } from "@skill-platform/ui"
import { useActiveItem } from "../../hooks/useActiveItem"
import { Icon } from "../Icon"
import { LayoutHeader } from "./LayoutHeader"
import { SidebarProvider, useSidebar } from "./SidebarContext"
import { useAuthStore } from "../../store/authStore"

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M20 8v6" />
      <path d="M23 11h-6" />
    </svg>
  )
}

function getSections(userRole: string | undefined, t: (key: string) => string): SidebarSection[] {
  const gettingStartedItems: SidebarSection["items"] = [
    { id: "dashboard", label: t("sidebar.overview"), icon: <Icon name="home" /> },
    { id: "skills", label: t("sidebar.skillsMarket"), icon: <Icon name="store" /> },
    { id: "third-party-repos", label: t("sidebar.thirdPartyRepos"), icon: <Icon name="git-branch" /> },
    { id: "my-skills", label: t("sidebar.mySkills"), icon: <Icon name="layers" /> },
    { id: "installed-skills", label: t("sidebar.installed"), icon: <Icon name="download" /> },
  ]

  if (userRole === "admin") {
    gettingStartedItems.push({ id: "users", label: t("sidebar.userManagement"), icon: <UsersIcon /> })
  }

  return [
    {
      title: t("sidebar.gettingStarted"),
      items: gettingStartedItems,
    },
  ]
}

function LayoutContent() {
  const { t } = useTranslation()
  const { activeItem, navigateTo } = useActiveItem()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { collapsed, setCollapsed } = useSidebar()

  const sections = useMemo(() => getSections(user?.role, t), [user?.role, t])

  return (
    <div className="flex h-screen w-full bg-white text-geist-text antialiased">
      <Sidebar
        title={t("appName")}
        logo={<Icon name="cube" />}
        beta
        sections={sections}
        activeItem={activeItem}
        onItemClick={(item) => navigateTo(item.id)}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        footer={
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className={cn(
              "flex items-center rounded-lg text-left transition-colors hover:bg-geist-surface-secondary",
              collapsed ? "w-full justify-center p-1" : "w-full gap-3"
            )}
            title={t("sidebar.openSettings")}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-geist-surface-secondary text-xs font-medium text-geist-text shadow-geist-border">
              {user?.username?.slice(0, 1).toUpperCase() ?? "U"}
            </div>
            {!collapsed && (
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-geist-text">
                  {user?.username ?? t("sidebar.notLoggedIn")}
                </span>
                <span className="truncate text-xs text-geist-text-muted">{user?.email ?? ""}</span>
              </div>
            )}
          </button>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <LayoutHeader title={t("header.defaultTitle")} />
        <div className="flex-1 overflow-auto overscroll-none">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export function Layout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  )
}

export default Layout
