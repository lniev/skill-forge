import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@skill-platform/ui"
import { useAuthStore } from "../../store/authStore"
import { useSettingsStore } from "../../store/settingsStore"
import { logout as logoutApi, changePassword } from "../../services/auth"
import { getErrorMessage } from "../../utils/error"

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
]

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const {
    aiApiUrl,
    aiApiKey,
    aiModel,
    serverUrl,
    language,
    setAiApiUrl,
    setAiApiKey,
    setAiModel,
    setServerUrl,
    setLanguage,
  } = useSettingsStore()

  const [aiForm, setAiForm] = React.useState({
    aiApiUrl,
    aiApiKey,
    aiModel,
  })

  const [serverUrlForm, setServerUrlForm] = React.useState(serverUrl)

  React.useEffect(() => {
    setServerUrlForm(serverUrl)
  }, [serverUrl])

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false)
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleLogout = async () => {
    try {
      await logoutApi()
    } catch {
      // ignore
    } finally {
      clearAuth()
      navigate("/login", { replace: true })
      toast({ toastType: "success", title: t("settings.logoutSuccess") })
    }
  }

  const handleSaveAi = async () => {
    await setAiApiUrl(aiForm.aiApiUrl)
    await setAiApiKey(aiForm.aiApiKey)
    await setAiModel(aiForm.aiModel)
    toast({ toastType: "success", title: t("settings.aiConfigSaved") })
  }

  const handleSaveServerUrl = async () => {
    await setServerUrl(serverUrlForm.trim())
    toast({ toastType: "success", title: t("settings.serverUrlSaved") })
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ toastType: "error", title: t("settings.changePasswordDialog.passwordMismatch") })
      return
    }

    setIsSubmitting(true)
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      })
      toast({ toastType: "success", title: t("settings.changePasswordDialog.passwordChanged") })
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setIsPasswordDialogOpen(false)
    } catch (err) {
      toast({
        toastType: "error",
        title: t("settings.changePasswordDialog.passwordChangeFailed"),
        description: getErrorMessage(err, t),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLanguageChange = async (value: string) => {
    await setLanguage(value)
    await i18n.changeLanguage(value)
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-[-1.2px] text-geist-text">{t("settings.title")}</h1>
        <p className="mt-2 text-geist-text-secondary">{t("settings.subtitle")}</p>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-geist-surface-secondary text-lg font-medium text-geist-text">
              {user?.username?.slice(0, 1).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-geist-text">{user?.username ?? t("sidebar.notLoggedIn")}</p>
              <p className="truncate text-sm text-geist-text-secondary">{user?.email ?? ""}</p>
              <p className="text-xs text-geist-text-muted capitalize">{user?.role ?? ""}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogoutIcon />
              {t("actions.logout")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.accountSecurity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)} className="w-full">
              {t("settings.changePassword")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.serverSettings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serverUrl">{t("settings.serverUrlLabel")}</Label>
              <Input
                id="serverUrl"
                type="url"
                placeholder={t("serverSettings.hostPlaceholder")}
                value={serverUrlForm}
                onChange={(e) => setServerUrlForm(e.target.value)}
              />
              <p className="text-xs text-geist-text-muted">{t("settings.serverUrlHint")}</p>
            </div>
            <Button onClick={handleSaveServerUrl} className="w-full">
              {t("actions.save")}
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("settings.changePasswordDialog.title")}</DialogTitle>
              <DialogDescription>{t("settings.changePasswordDialog.description")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("settings.changePasswordDialog.currentPassword")}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder={t("settings.changePasswordDialog.currentPasswordPlaceholder")}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("settings.changePasswordDialog.newPassword")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t("settings.changePasswordDialog.newPasswordPlaceholder")}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("settings.changePasswordDialog.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("settings.changePasswordDialog.confirmPasswordPlaceholder")}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                {t("actions.cancel")}
              </Button>
              <Button onClick={handleChangePassword} disabled={isSubmitting}>
                {isSubmitting ? t("actions.loading") : t("actions.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.aiModel")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aiApiUrl">{t("settings.modelUrl")}</Label>
              <Input
                id="aiApiUrl"
                type="url"
                placeholder={t("settings.modelUrlPlaceholder")}
                value={aiForm.aiApiUrl}
                onChange={(e) => setAiForm((prev) => ({ ...prev, aiApiUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aiApiKey">{t("settings.apiKey")}</Label>
              <Input
                id="aiApiKey"
                type="password"
                placeholder={t("settings.apiKeyPlaceholder")}
                value={aiForm.aiApiKey}
                onChange={(e) => setAiForm((prev) => ({ ...prev, aiApiKey: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aiModel">{t("settings.model")}</Label>
              <Input
                id="aiModel"
                placeholder={t("settings.modelPlaceholder")}
                value={aiForm.aiModel}
                onChange={(e) => setAiForm((prev) => ({ ...prev, aiModel: e.target.value }))}
              />
            </div>
            <Button onClick={handleSaveAi} className="w-full">
              {t("actions.save")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.language")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">{t("settings.language")}</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-geist-text-muted">{t("settings.languageDescription")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
