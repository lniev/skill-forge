import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import type { CreateUserPayload, ListUsersQuery, UpdateUserPayload } from "@skill-platform/api"
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  updateUser,
} from "../../../services/users"

export function useUsers(params: ListUsersQuery = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      resetUserPassword(id, { newPassword }),
  })
}
