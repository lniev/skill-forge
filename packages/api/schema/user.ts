import { z } from "zod"

/**
 * 用户角色。
 */
export const userRoleSchema = z.enum(["user", "admin"])

/**
 * 用户账号状态。
 */
export const userStatusSchema = z.enum(["active", "inactive", "deleted"])

/**
 * 用户信息。
 */
export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  role: userRoleSchema,
  status: userStatusSchema,
})

/**
 * 用户列表排序方式。
 */
export const usersSortSchema = z.enum(["createdAt", "updatedAt", "username"])

/**
 * 用户列表查询参数。
 */
export const listUsersQuerySchema = z.object({
  query: z.string().optional(),
  status: userStatusSchema.optional(),
  role: userRoleSchema.optional(),
  sort: usersSortSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

/**
 * 管理员新建用户请求。
 */
export const createUserSchema = z.object({
  username: z.string().min(3, "用户名至少 3 个字符").max(32, "用户名最多 32 个字符"),
  email: z.string().email("请输入有效的邮箱"),
  password: z
    .string()
    .min(8, "密码至少 8 位")
    .regex(/[A-Z]/, "密码需包含大写字母")
    .regex(/[a-z]/, "密码需包含小写字母")
    .regex(/[0-9]/, "密码需包含数字"),
  role: userRoleSchema.default("user"),
  status: userStatusSchema.default("active"),
})

/**
 * 更新用户请求。
 */
export const updateUserSchema = z.object({
  username: z.string().min(3).max(32).optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
})

/**
 * 重置用户密码请求。
 */
export const resetUserPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "密码至少 8 位")
    .regex(/[A-Z]/, "密码需包含大写字母")
    .regex(/[a-z]/, "密码需包含小写字母")
    .regex(/[0-9]/, "密码需包含数字"),
})

/**
 * 用户列表项，包含 Skill 统计和最后登录时间。
 */
export const userListItemSchema = userSchema.extend({
  createdAt: z.string().datetime().nullable().optional(),
  skillCount: z.number().int().nonnegative(),
  lastLoginAt: z.string().datetime().nullable().optional(),
})

/**
 * 分页用户列表响应。
 */
export const paginatedUsersSchema = z.object({
  items: z.array(userListItemSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
})

/**
 * 用户详情响应。
 */
export const userDetailSchema = userSchema.extend({
  createdAt: z.string().datetime().nullable().optional(),
  skillCount: z.number().int().nonnegative(),
  lastLoginAt: z.string().datetime().nullable().optional(),
})

/** 用户角色。 */
export type UserRole = z.infer<typeof userRoleSchema>

/** 用户账号状态。 */
export type UserStatus = z.infer<typeof userStatusSchema>

/** 用户信息。 */
export type User = z.infer<typeof userSchema>

/** 用户列表查询参数。 */
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>

/** 管理员新建用户请求。 */
export type CreateUserPayload = z.infer<typeof createUserSchema>

/** 更新用户请求。 */
export type UpdateUserPayload = z.infer<typeof updateUserSchema>

/** 重置用户密码请求。 */
export type ResetUserPasswordPayload = z.infer<typeof resetUserPasswordSchema>

/** 用户列表项。 */
export type UserListItem = z.infer<typeof userListItemSchema>

/** 用户详情。 */
export type UserDetail = z.infer<typeof userDetailSchema>

/** 分页用户列表响应。 */
export type PaginatedUsers = z.infer<typeof paginatedUsersSchema>
