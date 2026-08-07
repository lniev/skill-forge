import { ApiError } from "@skill-platform/api"

export function getErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    return t(`errors.api.${error.code}`)
  }
  if (error instanceof Error) {
    return error.message
  }
  return t("actions.unknownError")
}
