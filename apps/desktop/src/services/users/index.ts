import type {
  CreateUserPayload,
  ListUsersQuery,
  PaginatedUsers,
  ResetUserPasswordPayload,
  UpdateUserPayload,
  UserDetail,
  UserListItem,
  SkillListItem,
} from "@skill-platform/api"
import { request, parseResponse } from "../request"

export async function listUsers(params: ListUsersQuery = {}): Promise<PaginatedUsers> {
  const searchParams = new URLSearchParams()
  if (params.query) searchParams.set("query", params.query)
  if (params.status) searchParams.set("status", params.status)
  if (params.role) searchParams.set("role", params.role)
  if (params.sort) searchParams.set("sort", params.sort)
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit))
  if (params.offset !== undefined) searchParams.set("offset", String(params.offset))

  const response = await request.get("users", { searchParams })
  return parseResponse<PaginatedUsers>(response)
}

export async function getUser(id: string): Promise<UserDetail> {
  const response = await request.get(`users/${id}`)
  return parseResponse<UserDetail>(response)
}

export async function createUser(payload: CreateUserPayload): Promise<UserListItem> {
  const response = await request.post("users", { json: payload })
  return parseResponse<UserListItem>(response)
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<UserListItem> {
  const response = await request.patch(`users/${id}`, { json: payload })
  return parseResponse<UserListItem>(response)
}

export async function deleteUser(id: string): Promise<UserListItem> {
  const response = await request.delete(`users/${id}`)
  return parseResponse<UserListItem>(response)
}

export async function resetUserPassword(id: string, payload: ResetUserPasswordPayload): Promise<void> {
  const response = await request.post(`users/${id}/reset-password`, { json: payload })
  return parseResponse<void>(response)
}

export async function getUserSkills(id: string): Promise<{
  items: SkillListItem[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}> {
  const response = await request.get(`users/${id}/skills`)
  return parseResponse<{
    items: SkillListItem[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }>(response)
}
