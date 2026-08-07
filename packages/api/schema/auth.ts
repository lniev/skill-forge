import { z } from "zod"
import { userSchema } from "./user.js"

export { userRoleSchema, userStatusSchema, userSchema } from "./user.js"

/**
 * 登录请求。
 */
export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱"),
  password: z.string().min(1, "请输入密码"),
})

/**
 * 注册请求。
 */
export const registerSchema = z
  .object({
    username: z.string().min(3, "用户名至少 3 个字符").max(32, "用户名最多 32 个字符"),
    email: z.string().email("请输入有效的邮箱"),
    password: z
      .string()
      .min(8, "密码至少 8 位")
      .regex(/[A-Z]/, "密码需包含大写字母")
      .regex(/[a-z]/, "密码需包含小写字母")
      .regex(/[0-9]/, "密码需包含数字"),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((value) => value, "请同意服务协议"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  })

/**
 * 忘记密码请求。
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("请输入有效的邮箱"),
})

/**
 * 重置密码请求。
 */
export const resetPasswordSchema = z
  .object({
    email: z.string().email("请输入有效的邮箱"),
    code: z.string().length(6, "验证码为 6 位"),
    newPassword: z
      .string()
      .min(8, "密码至少 8 位")
      .regex(/[A-Z]/, "密码需包含大写字母")
      .regex(/[a-z]/, "密码需包含小写字母")
      .regex(/[0-9]/, "密码需包含数字"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  })

/**
 * 修改密码请求（已登录用户）。
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    newPassword: z
      .string()
      .min(8, "密码至少 8 位")
      .regex(/[A-Z]/, "密码需包含大写字母")
      .regex(/[a-z]/, "密码需包含小写字母")
      .regex(/[0-9]/, "密码需包含数字"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  })

/**
 * 登录/注册成功响应。
 */
export const authTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userSchema,
})

/** 登录请求。 */
export type LoginPayload = z.infer<typeof loginSchema>

/** 注册请求。 */
export type RegisterPayload = z.infer<typeof registerSchema>

/** 忘记密码请求。 */
export type ForgotPasswordPayload = z.infer<typeof forgotPasswordSchema>

/** 重置密码请求。 */
export type ResetPasswordPayload = z.infer<typeof resetPasswordSchema>

/** 修改密码请求。 */
export type ChangePasswordPayload = z.infer<typeof changePasswordSchema>

/** 登录/注册成功响应。 */
export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>
