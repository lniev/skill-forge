import { useState } from "react"
import { useTranslation, Trans } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { registerSchema, type RegisterPayload } from "@skill-platform/api"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  toast,
} from "@skill-platform/ui"
import { register } from "../../services/auth"
import { useAuthStore } from "../../store/authStore"
import { getErrorMessage } from "../../utils/error"

export function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RegisterPayload>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  })

  const onSubmit = async (values: RegisterPayload) => {
    setIsSubmitting(true)
    try {
      const response = await register(values)
      await setAuth(response.accessToken, response.refreshToken, response.user)

      toast({ toastType: "success", title: t("auth.registerSuccess") })
      navigate("/", { replace: true })
    } catch (err) {
      toast({
        toastType: "error",
        title: t("auth.registerFailed"),
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
          <CardTitle className="text-xl tracking-[-0.5px] text-geist-text">{t("auth.registerTitle")}</CardTitle>
          <CardDescription>{t("auth.registerSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.username")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("auth.usernamePlaceholder")} {...field} />
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
                      <Input type="password" placeholder={t("settings.changePasswordDialog.newPasswordPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t("auth.confirmPasswordPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mt-1 h-4 w-4 rounded border-geist-border text-geist-text focus:ring-geist-focus"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal text-geist-text-secondary">
                        <Trans i18nKey="auth.agreeToTerms" components={[<span key="terms" className="text-geist-text underline" />]} />
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("auth.registering") : t("auth.registerButton")}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <span className="text-geist-text-muted">{t("auth.hasAccount")}</span>
          <Link to="/login" className="ml-1 text-geist-text hover:underline">
            {t("auth.goLogin")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Register
