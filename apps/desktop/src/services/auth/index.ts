import type {
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
  AuthTokenResponse,
  User,
} from "@skill-platform/api"
import { request, parseResponse } from "../request"
import { getStore } from "../../lib/store"

const REFRESH_TOKEN_KEY = "refreshToken"

export async function storeRefreshToken(token: string): Promise<void> {
  const store = await getStore()
  await store.set(REFRESH_TOKEN_KEY, token)
  await store.save()
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await getStore()
  const token = await store.get<string>(REFRESH_TOKEN_KEY)
  return token ?? null
}

export async function deleteRefreshToken(): Promise<void> {
  const store = await getStore()
  await store.delete(REFRESH_TOKEN_KEY)
  await store.save()
}

export async function login(payload: LoginPayload): Promise<AuthTokenResponse> {
  const response = await request.post("auth/login", { json: payload })
  return parseResponse<AuthTokenResponse>(response)
}

export async function register(payload: RegisterPayload): Promise<AuthTokenResponse> {
  const response = await request.post("auth/register", { json: payload })
  return parseResponse<AuthTokenResponse>(response)
}

export async function logout(): Promise<void> {
  await request.post("auth/logout")
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokenResponse> {
  const response = await request.post("auth/refresh", { json: { refreshToken } })
  return parseResponse<AuthTokenResponse>(response)
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  const response = await request.post("auth/forgot-password", { json: payload })
  return parseResponse<void>(response)
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  const response = await request.post("auth/reset-password", { json: payload })
  return parseResponse<void>(response)
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  const response = await request.post("auth/change-password", { json: payload })
  return parseResponse<void>(response)
}

export async function getMe(): Promise<User> {
  const response = await request.get("auth/me")
  return parseResponse<User>(response)
}
