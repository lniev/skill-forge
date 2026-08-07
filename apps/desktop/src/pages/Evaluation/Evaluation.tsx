import * as React from "react"
import { useTranslation } from "react-i18next"
import { Card, CardTitle, CardDescription } from "@skill-platform/ui"

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-geist-text-muted">
      <path d="M3 3v18h18" />
      <path d="M19 9l-5 5-3-3-4 4" />
    </svg>
  )
}

export default function Evaluation() {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-[-1.2px] text-geist-text">
          {t("evaluation.title")}
        </h1>
        <p className="mt-2 text-geist-text-secondary">
          {t("evaluation.subtitle")}
        </p>
      </div>

      <div className="grid flex-1 place-items-center">
        <Card className="flex max-w-md flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-geist-surface-secondary">
            <ChartIcon />
          </div>
          <CardTitle className="text-lg text-geist-text">{t("evaluation.cardTitle")}</CardTitle>
          <CardDescription>{t("evaluation.cardDescription")}</CardDescription>
        </Card>
      </div>
    </div>
  )
}
