import ky from "ky"
import { ApiError, type ApiErrorCode } from "@skill-platform/api"
import { useAuthStore } from "../store/authStore"
import { useSettingsStore } from "../store/settingsStore"
import { getRefreshToken, refreshAccessToken } from "./auth"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api"

function getEffectiveApiBaseUrl(): string {
  return useSettingsStore.getState().serverUrl || API_BASE_URL
}

function rewriteUrl(originalUrl: string, baseUrl: string): string {
  const original = new URL(originalUrl)
  const base = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`)
  const defaultBase = new URL(API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`)

  const defaultPath = defaultBase.pathname
  const apiPath = original.pathname.startsWith(defaultPath)
    ? original.pathname.slice(defaultPath.length)
    : original.pathname

  return `${base.protocol}//${base.host}${base.pathname}${apiPath}${original.search}`
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  code?: ApiErrorCode
  message?: string
}

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function doRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await refreshAccessToken(refreshToken)
    useAuthStore.getState().setAuth(response.accessToken, response.refreshToken ?? refreshToken, response.user)
    return response.accessToken
  } catch {
    return null
  }
}

function getNewToken(): Promise<string | null> {
  if (!isRefreshing) {
    isRefreshing = true
    refreshPromise = doRefresh().finally(() => {
      isRefreshing = false
      refreshPromise = null
    })
  }
  return refreshPromise ?? Promise.resolve(null)
}

export const request = ky.create({
  prefix: `${API_BASE_URL}/`,
  throwHttpErrors: false,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = useAuthStore.getState().accessToken
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
        }

        const effectiveBaseUrl = getEffectiveApiBaseUrl()
        if (effectiveBaseUrl !== API_BASE_URL) {
          const newUrl = rewriteUrl(request.url, effectiveBaseUrl)
          return new Request(newUrl, request)
        }
      },
    ],
    afterResponse: [
      async ({ request, response }) => {
        if (response.status !== 401) {
          return response
        }

        // Avoid refreshing on auth endpoints themselves
        if (request.url.includes("/auth/")) {
          return response
        }

        const newToken = await getNewToken()
        if (!newToken) {
          await useAuthStore.getState().clearAuth()
          window.location.hash = "#/login"
          return response
        }

        const newRequest = new Request(request)
        newRequest.headers.set("Authorization", `Bearer ${newToken}`)
        return ky(newRequest, { throwHttpErrors: false })
      },
    ],
  },
})

export async function parseResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T>

  if (!result.success) {
    throw new ApiError(result.code ?? "INTERNAL_ERROR", response.status, result.message)
  }

  return result.data
}
