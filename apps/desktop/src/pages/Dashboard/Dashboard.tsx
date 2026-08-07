import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Card, CardTitle, CardDescription, Button } from "@skill-platform/ui"
import { useAuthStore } from "../../store/authStore"
import { useInstalledSkills } from "../../services/installs/useInstalledSkills"
import { useSkills } from "../Skills/hooks/useSkills"

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: installedData } = useInstalledSkills()
  const { data: mySkillsData } = useSkills({
    userId: user?.id,
    limit: 0,
    offset: 0,
  })
  const { data: marketData } = useSkills({
    limit: 0,
    offset: 0,
  })

  const stats: { label: string; value: string | number; href: string }[] = [
    { label: t("dashboard.installedSkills"), value: installedData?.length ?? "—", href: "/installed-skills" },
    { label: t("dashboard.mySkills"), value: mySkillsData?.total ?? "—", href: "/my-skills" },
    { label: t("dashboard.availableVersions"), value: marketData?.total ?? "—", href: "/skills" },
  ]

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-[-1.6px] text-geist-text">
          {t("dashboard.welcome")}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-geist-text-secondary">
          {t("dashboard.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="flex cursor-pointer flex-col gap-1 p-5 transition-shadow hover:shadow-geist-card-hover"
            onClick={() => navigate(stat.href)}
          >
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-3xl tracking-[-1px] text-geist-text">{stat.value}</CardTitle>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Button onClick={() => navigate("/skills")}>
          {t("dashboard.browseMarket")}
          <ArrowRightIcon />
        </Button>
        <Button variant="outline" onClick={() => navigate("/skills/upload")}>
          {t("dashboard.uploadSkill")}
        </Button>
      </div>
    </div>
  )
}
