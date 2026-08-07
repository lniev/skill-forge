import { useEffect } from "react"
import { useAuthStore } from "../store/authStore"
import { getMe, refreshAccessToken } from "../services/auth"
import { getRefreshToken } from "../services/auth"

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, restoreAuth, setLoading } = useAuthStore()

  useEffect(() => {
    async function init() {
      try {
        await restoreAuth()
        const state = useAuthStore.getState()

        if (state.isAuthenticated) {
          // 已恢复 accessToken + user，尝试同步最新用户信息
          try {
            const user = await getMe()
            useAuthStore.getState().updateUser(user)
          } catch {
            // ignore
          }
          return
        }

        // 没有 accessToken，但有 refreshToken，尝试刷新
        const refreshToken = await getRefreshToken()
        if (!refreshToken) {
          setLoading(false)
          return
        }

        const response = await refreshAccessToken(refreshToken)
        await setAuth(response.accessToken, response.refreshToken ?? refreshToken, response.user)

        try {
          const user = await getMe()
          useAuthStore.getState().updateUser(user)
        } catch {
          // ignore
        }
      } catch {
        await clearAuth()
      } finally {
        useAuthStore.getState().setLoading(false)
      }
    }

    init()
  }, [setAuth, clearAuth, restoreAuth, setLoading])

  return <>{children}</>
}
