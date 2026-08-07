import { create } from "zustand"
import type { User } from "@skill-platform/api"
import { getStore } from "../lib/store"

const ACCESS_TOKEN_KEY = "accessToken"
const REFRESH_TOKEN_KEY = "refreshToken"
const USER_KEY = "user"

interface AuthState {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  setAuth: (accessToken: string, refreshToken: string, user: User) => Promise<void>
  clearAuth: () => Promise<void>
  setLoading: (loading: boolean) => void
  updateUser: (user: Partial<User>) => void
  restoreAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (accessToken, refreshToken, user) => {
    try {
      const store = await getStore()
      await Promise.all([
        store.set(ACCESS_TOKEN_KEY, accessToken),
        store.set(REFRESH_TOKEN_KEY, refreshToken),
        store.set(USER_KEY, user),
      ])
      await store.save()
    } catch (err) {
      console.error("Failed to persist auth state:", err)
    }
    set({
      accessToken,
      user,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  clearAuth: async () => {
    try {
      const store = await getStore()
      await Promise.all([
        store.delete(ACCESS_TOKEN_KEY),
        store.delete(REFRESH_TOKEN_KEY),
        store.delete(USER_KEY),
      ])
      await store.save()
    } catch (err) {
      console.error("Failed to clear auth state:", err)
    }
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  setLoading: (isLoading) => set({ isLoading }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  restoreAuth: async () => {
    try {
      const store = await getStore()
      const [accessToken, refreshToken, user] = await Promise.all([
        store.get<string>(ACCESS_TOKEN_KEY),
        store.get<string>(REFRESH_TOKEN_KEY),
        store.get<User>(USER_KEY),
      ])

      if (accessToken && user) {
        set({
          accessToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      } else if (refreshToken) {
        set({ isLoading: true })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },
}))
