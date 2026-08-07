import * as React from "react"

export interface SidebarBadge {
  label: string
  variant?: "default" | "secondary" | "outline" | "pro" | "new" | "alpha"
}

export interface SidebarItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: SidebarBadge
  children?: SidebarItem[]
  onClick?: () => void
}

export interface SidebarSection {
  title?: string
  items: SidebarItem[]
}

export interface SidebarProps {
  title?: string
  logo?: React.ReactNode
  beta?: boolean
  betaText?: string
  sections: SidebarSection[]
  activeItem?: string
  onItemClick?: (item: SidebarItem) => void
  className?: string
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  footer?: React.ReactNode
}
