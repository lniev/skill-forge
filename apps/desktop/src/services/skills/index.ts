import {
  type Skill,
  type SkillListItem,
  type SkillVersion,
  type ListSkillsQuery,
  type CreateSkillWithVersionRequest,
  type CreateSkillWithVersionData,
  type CreateSkillPayload,
  type CreateVersionPayload,
  type PaginatedSkillsData,
} from "@skill-platform/api"
import { request, parseResponse } from "../request"

export type {
  Skill,
  SkillListItem,
  SkillVersion,
  ListSkillsQuery,
  CreateSkillWithVersionRequest,
  CreateSkillWithVersionData,
  CreateSkillPayload,
  CreateVersionPayload,
}

export async function listSkills(params: ListSkillsQuery = {}): Promise<PaginatedSkillsData> {
  const searchParams = new URLSearchParams()
  if (params.query) searchParams.set("query", params.query)
  if (params.category) searchParams.set("category", params.category)
  if (params.subCategory) searchParams.set("subCategory", params.subCategory)
  if (params.author) searchParams.set("author", params.author)
  if (params.userId) searchParams.set("userId", params.userId)
  if (params.status) searchParams.set("status", params.status)
  if (params.sort) searchParams.set("sort", params.sort)
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit))
  if (params.offset !== undefined) searchParams.set("offset", String(params.offset))

  const response = await request.get("skills", { searchParams })
  return parseResponse<PaginatedSkillsData>(response)
}

export async function getSkill(id: string): Promise<Skill> {
  const response = await request.get(`skills/${id}`)
  return parseResponse<Skill>(response)
}

export async function updateSkill(id: string, payload: Partial<CreateSkillPayload>): Promise<Skill> {
  const response = await request.patch(`skills/${id}`, { json: payload })
  return parseResponse<Skill>(response)
}

export async function deleteSkill(id: string): Promise<null> {
  const response = await request.delete(`skills/${id}`)
  return parseResponse<null>(response)
}

export async function createSkillWithVersion(
  payload: CreateSkillWithVersionRequest,
  files: File[] = []
): Promise<CreateSkillWithVersionData> {
  if (files.length > 0) {
    const formData = new FormData()
    formData.append("data", JSON.stringify(payload))
    files.forEach((file) => formData.append("file", file))

    const response = await request.post("skills/create-with-version", { body: formData })
    return parseResponse<CreateSkillWithVersionData>(response)
  }

  const response = await request.post("skills/create-with-version", { json: payload })
  return parseResponse<CreateSkillWithVersionData>(response)
}

export async function publishSkillVersion(skillId: string, version: string): Promise<SkillVersion> {
  const response = await request.post(`skills/${skillId}/versions/${version}/publish`, { json: {} })
  return parseResponse<SkillVersion>(response)
}

export async function getSkillVersions(id: string): Promise<SkillVersion[]> {
  const response = await request.get(`skills/${id}/versions`)
  return parseResponse<SkillVersion[]>(response)
}

export async function getSkillVersion(id: string, version: string): Promise<SkillVersion> {
  const response = await request.get(`skills/${id}/versions/${version}`)
  return parseResponse<SkillVersion>(response)
}

export async function getEditVersion(id: string): Promise<SkillVersion> {
  const response = await request.get(`skills/${id}/edit-version`)
  return parseResponse<SkillVersion>(response)
}

export async function updateSkillVersion(
  skillId: string,
  version: string,
  payload: Partial<CreateVersionPayload>
): Promise<SkillVersion> {
  const response = await request.patch(`skills/${skillId}/versions/${version}`, { json: payload })
  return parseResponse<SkillVersion>(response)
}

export async function createSkill(payload: CreateSkillPayload): Promise<Skill> {
  const response = await request.post("skills", { json: payload })
  return parseResponse<Skill>(response)
}
