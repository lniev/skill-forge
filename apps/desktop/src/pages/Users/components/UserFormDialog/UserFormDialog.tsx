import * as React from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { UserListItem, UserStatus } from "@skill-platform/api"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@skill-platform/ui"

const baseUserFormSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  role: z.enum(["user", "admin"]),
  status: z.enum(["active", "inactive", "deleted"]),
})

export const createUserFormSchema = baseUserFormSchema.extend({
  password: z.string().min(8),
})

const editUserFormSchema = baseUserFormSchema.extend({
  password: z.string().optional(),
})

export type CreateUserFormValues = z.infer<typeof baseUserFormSchema> & { password?: string }

export interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserListItem | null
  onSubmit: (values: CreateUserFormValues) => void
  isSubmitting: boolean
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isSubmitting,
}: UserFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = !!user

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(isEdit ? editUserFormSchema : createUserFormSchema),
    defaultValues: {
      username: user?.username ?? "",
      email: user?.email ?? "",
      password: "",
      role: (user?.role as "user" | "admin") ?? "user",
      status: (user?.status as UserStatus) ?? "active",
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        username: user?.username ?? "",
        email: user?.email ?? "",
        password: "",
        role: (user?.role as "user" | "admin") ?? "user",
        status: (user?.status as UserStatus) ?? "active",
      })
    }
  }, [open, user, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("users.formTitleEdit") : t("users.formTitleCreate")}</DialogTitle>
          <DialogDescription>{isEdit ? t("users.formDescriptionEdit") : t("users.formDescriptionCreate")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.username")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("users.usernamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.email")}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t("users.emailPlaceholder")} disabled={isEdit} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEdit && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("users.password")}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t("users.passwordPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.role")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.status")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="inactive">inactive</SelectItem>
                      <SelectItem value="deleted">deleted</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("users.saving") : t("users.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
