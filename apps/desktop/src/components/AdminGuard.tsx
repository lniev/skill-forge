import * as React from "react"
import { Navigate } from "react-router-dom"
import { useAuthStore } from "../store/authStore"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return null
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
