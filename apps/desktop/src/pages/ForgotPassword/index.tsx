import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router-dom"
import { forgotPasswordSchema, type ForgotPasswordPayload } from "@skill-platform/api"
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
import { forgotPassword } from "../../services/auth"
import { getErrorMessage } from "../../utils/error"

export function ForgotPassword() {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ForgotPasswordPayload>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (values: ForgotPasswordPayload) => {
    setIsSubmitting(true)
    try {
      await forgotPassword(values)
      setSubmitted(true)
      toast({ toastType: "success", title: t("auth.verificationSent"), description: t("auth.checkEmail") })
    } catch (err) {
      toast({
        toastType: "error",
        title: t("auth.sendVerification"),
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
          <CardTitle className="text-xl tracking-[-0.5px] text-geist-text">{t("auth.forgotPasswordTitle")}</CardTitle>
          <CardDescription>{t("auth.forgotPasswordSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="rounded-lg bg-geist-surface-secondary p-4 text-center text-sm text-geist-text-muted">
              {t("auth.verificationSentTo", { email: form.getValues("email") })}
            </div>
          ) : (
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("actions.sending") : t("auth.sendVerification")}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <Link to="/login" className="text-geist-text-muted hover:text-geist-text hover:underline">
            {t("auth.returnToLogin")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ForgotPassword
