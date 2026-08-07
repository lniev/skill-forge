import { useEffect, useState } from "react"
import { useTranslation, Trans } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { loginSchema, type LoginPayload } from "@skill-platform/api"
import { z } from "zod"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Label,
  toast,
} from "@skill-platform/ui"
import { login } from "../../services/auth"
import { useAuthStore } from "../../store/authStore"
import { useSettingsStore } from "../../store/settingsStore"
import { getErrorMessage } from "../../utils/error"

type LoginFormValues = z.infer<typeof loginSchema>

export function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isServerSettingOpen, setIsServerSettingOpen] = useState(false)
  const { serverUrl, setServerUrl } = useSettingsStore()
  const [serverUrlForm, setServerUrlForm] = useState(serverUrl)

  useEffect(() => {
    setServerUrlForm(serverUrl)
  }, [serverUrl])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleSaveServerUrl = async () => {
    await setServerUrl(serverUrlForm.trim())
    toast({ toastType: "success", title: t("serverSettings.saved") })
    setIsServerSettingOpen(false)
  }

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    try {
      const payload: LoginPayload = {
        email: values.email,
        password: values.password,
      }
      const response = await login(payload)
      await setAuth(response.accessToken, response.refreshToken, response.user)

      toast({ toastType: "success", title: t("auth.loginSuccess") })

      const from = searchParams.get("from")
      navigate(from ? decodeURIComponent(from) : "/", { replace: true })
    } catch (err) {
      toast({
        toastType: "error",
        title: t("auth.loginFailed"),
        description: getErrorMessage(err, t),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-geist-foreground text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-xl tracking-[-0.5px] text-geist-text">{t("auth.loginTitle")}</CardTitle>
          <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.email")}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t("auth.emailPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.password")}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t("auth.passwordPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("auth.loggingIn") : t("auth.loginButton")}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between text-sm">
          <Link to="/register" className="text-geist-text-muted hover:text-geist-text hover:underline">
            {t("auth.noAccount")}
          </Link>
          {/*<Link to="/forgot-password" className="text-geist-text-muted hover:text-geist-text hover:underline">*/}
          {/*  {t("auth.forgotPasswordLink")}*/}
          {/*</Link>*/}
        </CardFooter>
      </Card>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsServerSettingOpen(true)}
        className="fixed bottom-4 left-4 text-geist-text-muted hover:text-geist-text"
      >
        {t("serverSettings.openSettings")}
      </Button>

      <Dialog open={isServerSettingOpen} onOpenChange={setIsServerSettingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("serverSettings.title")}</DialogTitle>
            <DialogDescription>{t("serverSettings.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serverUrl">{t("serverSettings.serverUrlLabel")}</Label>
              <Input
                id="serverUrl"
                type="url"
                placeholder={t("serverSettings.hostPlaceholder")}
                value={serverUrlForm}
                onChange={(e) => setServerUrlForm(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServerSettingOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button onClick={handleSaveServerUrl}>{t("actions.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Login
