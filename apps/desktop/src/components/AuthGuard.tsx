import { useEffect } from "react"
import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { useAuthStore } from "../store/authStore"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const from = encodeURIComponent(location.pathname + location.search)
      navigate(`/login?from=${from}`, { replace: true })
    }
  }, [isLoading, isAuthenticated, navigate, location])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : null
}
