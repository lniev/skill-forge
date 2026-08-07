import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  Button,
  Card,
  CardContent,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  toast,
} from "@skill-platform/ui"
import { cn } from "@skill-platform/ui/lib/utils"
import type { UserListItem, UserStatus } from "@skill-platform/api"
import { useAuthStore } from "../../store/authStore"
import { getErrorMessage } from "../../utils/error"
import {
  useCreateUser,
  useDeleteUser,
  useResetUserPassword,
  useUpdateUser,
  useUsers,
} from "./hooks/useUsers"
import { ResetPasswordDialog } from "./components/ResetPasswordDialog"
import { UserFormDialog, type CreateUserFormValues } from "./components/UserFormDialog"

const PAGE_SIZE = 10

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return "-"
  return new Date(value).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "active":
      return "default"
    case "inactive":
      return "secondary"
    case "deleted":
      return "destructive"
    default:
      return "default"
  }
}

function UserAvatar({ username }: { username: string }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-geist-surface-secondary text-xs font-medium text-geist-text shadow-geist-border">
      {username.slice(0, 1).toUpperCase()}
    </div>
  )
}

export default function Users() {
  const { t, i18n } = useTranslation()
  const { user: currentUser } = useAuthStore()

  const [currentPage, setCurrentPage] = React.useState(1)
  const [query, setQuery] = React.useState("")
  const [statusTab, setStatusTab] = React.useState<UserStatus | "all">("all")
  const [roleFilter, setRoleFilter] = React.useState<"all" | "user" | "admin">("all")
  const [sort, setSort] = React.useState<(typeof SORT_OPTIONS)[number]["value"]>("createdAt")

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserListItem | null>(null)
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false)
  const [resetUser, setResetUser] = React.useState<UserListItem | null>(null)
  const [userToDelete, setUserToDelete] = React.useState<UserListItem | null>(null)

  const STATUS_TABS: { id: UserStatus | "all"; label: string }[] = [
    { id: "all", label: t("users.statusTabs.all") },
    { id: "active", label: t("users.statusTabs.active") },
    { id: "inactive", label: t("users.statusTabs.inactive") },
    { id: "deleted", label: t("users.statusTabs.deleted") },
  ]

  const ROLE_OPTIONS = [
    { value: "all", label: t("users.roleOptions.all") },
    { value: "user", label: t("users.roleOptions.user") },
    { value: "admin", label: t("users.roleOptions.admin") },
  ]

  const SORT_OPTIONS = [
    { value: "createdAt", label: t("users.sortOptions.createdAt") },
    { value: "updatedAt", label: t("users.sortOptions.updatedAt") },
    { value: "username", label: t("users.sortOptions.username") },
  ] as const

  const offset = (currentPage - 1) * PAGE_SIZE

  const params = React.useMemo(
    () => ({
      query: query.trim() || undefined,
      status: statusTab === "all" ? undefined : statusTab,
      role: roleFilter === "all" ? undefined : roleFilter,
      sort,
      limit: PAGE_SIZE,
      offset,
    }),
    [query, statusTab, roleFilter, sort, offset]
  )

  const { data, isLoading, error } = useUsers(params)
  const users = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()
  const resetPasswordMutation = useResetUserPassword()

  const handleCreateOrUpdate = async (values: CreateUserFormValues) => {
    try {
      if (editingUser) {
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          payload: {
            username: values.username,
            role: values.role,
            status: values.status,
          },
        })
        toast({ toastType: "success", title: t("users.updateSuccess") })
      } else {
        await createUserMutation.mutateAsync({
          username: values.username,
          email: values.email,
          password: values.password ?? "",
          role: values.role,
          status: values.status,
        })
        toast({ toastType: "success", title: t("users.createSuccess") })
      }
      setDialogOpen(false)
      setEditingUser(null)
    } catch (err) {
      toast({
        toastType: "error",
        title: editingUser ? t("users.updateFailed") : t("users.createFailed"),
        description: getErrorMessage(err, t),
      })
    }
  }

  const handleDeleteClick = (user: UserListItem) => {
    if (user.id === currentUser?.id) {
      toast({ toastType: "error", title: t("users.cannotDeleteSelf") })
      return
    }
    setUserToDelete(user)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    try {
      await deleteUserMutation.mutateAsync(userToDelete.id)
      toast({ toastType: "success", title: t("users.deleteSuccess") })
    } catch (err) {
      toast({
        toastType: "error",
        title: t("users.deleteFailed"),
        description: getErrorMessage(err, t),
      })
    } finally {
      setUserToDelete(null)
    }
  }

  const handleResetPassword = async (newPassword: string) => {
    if (!resetUser) return
    try {
      await resetPasswordMutation.mutateAsync({ id: resetUser.id, newPassword })
      toast({ toastType: "success", title: t("users.resetSuccess") })
      setResetDialogOpen(false)
      setResetUser(null)
    } catch (err) {
      toast({
        toastType: "error",
        title: t("users.resetFailed"),
        description: getErrorMessage(err, t),
      })
    }
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setDialogOpen(true)
  }

  const openEditDialog = (user: UserListItem) => {
    setEditingUser(user)
    setDialogOpen(true)
  }

  const openResetDialog = (user: UserListItem) => {
    setResetUser(user)
    setResetDialogOpen(true)
  }

  const isMutating = createUserMutation.isPending || updateUserMutation.isPending

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-[-1.2px] text-geist-text">{t("users.title")}</h1>
        <p className="mt-2 text-geist-text-secondary">{t("users.subtitle")}</p>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex w-full items-center sm:w-96">
              <span className="pointer-events-none absolute left-3 text-geist-text-muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder={t("users.searchPlaceholder")}
                className="flex h-9 w-full rounded-md bg-transparent px-3 py-2 pl-9 text-sm shadow-geist-border outline-none transition-colors placeholder:text-geist-text-muted focus-visible:ring-2 focus-visible:ring-geist-focus"
              />
            </div>
            <Button onClick={openCreateDialog}>{t("users.createUser")}</Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusTab(tab.id)
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    statusTab === tab.id
                      ? "bg-geist-foreground text-white"
                      : "bg-white text-geist-text shadow-geist-border hover:bg-geist-surface-secondary"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
                <SelectTrigger className="h-9 w-32 text-sm shadow-geist-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
                <SelectTrigger className="h-9 w-36 text-sm shadow-geist-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? (
            <div className="text-sm text-geist-error">{getErrorMessage(error, t)}</div>
          ) : isLoading ? (
            <div className="flex flex-1 flex-col gap-3 rounded-lg p-4 shadow-geist-border">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="min-w-0 flex-1 overflow-auto rounded-lg shadow-geist-border">
              <Table>
                <TableCaption className="sr-only">{t("users.userListCaption")}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("users.table.user")}</TableHead>
                    <TableHead>{t("users.table.email")}</TableHead>
                    <TableHead>{t("users.table.role")}</TableHead>
                    <TableHead>{t("users.table.status")}</TableHead>
                    <TableHead>{t("users.table.createdAt")}</TableHead>
                    <TableHead>{t("users.table.lastLoginAt")}</TableHead>
                    <TableHead>{t("users.table.skillCount")}</TableHead>
                    <TableHead className="text-right">{t("users.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-geist-text-muted">
                        {t("users.noUsers")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar username={user.username} />
                            <span className="font-medium text-geist-text">{user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Badge label={t(`users.statusTabs.${user.status}` as const)} variant={getStatusVariant(user.status)} />
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt, i18n.language)}</TableCell>
                        <TableCell>{formatDate(user.lastLoginAt, i18n.language)}</TableCell>
                        <TableCell>{user.skillCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
                              {t("users.edit")}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openResetDialog(user)}>
                              {t("users.resetPassword")}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(user)} disabled={user.id === currentUser?.id}>
                              {t("users.delete")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-auto" />
        </CardContent>
      </Card>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSubmit={handleCreateOrUpdate}
        isSubmitting={isMutating}
      />

      <ResetPasswordDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        user={resetUser}
        onSubmit={handleResetPassword}
        isSubmitting={resetPasswordMutation.isPending}
      />

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("users.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("users.deleteConfirmDescription", { username: userToDelete?.username })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-geist-foreground text-white hover:bg-geist-foreground/90">
              {t("actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
