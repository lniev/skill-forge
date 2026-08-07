import * as React from "react"
import { useTranslation } from "react-i18next"
import type { UserListItem } from "@skill-platform/api"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@skill-platform/ui"

export interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserListItem | null
  onSubmit: (newPassword: string) => void
  isSubmitting: boolean
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isSubmitting,
}: ResetPasswordDialogProps) {
  const { t } = useTranslation()
  const [newPassword, setNewPassword] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setNewPassword("")
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(newPassword)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("users.resetPasswordTitle")}</DialogTitle>
          <DialogDescription>{t("users.resetPasswordDescription", { username: user?.username })}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reset-password">{t("users.newPassword")}</Label>
            <Input
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("users.newPasswordPlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || newPassword.length < 8}>
              {isSubmitting ? t("users.resetting") : t("users.resetPassword")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
