import * as React from "react"
import { useTranslation } from "react-i18next"
import { useParams, useNavigate } from "react-router-dom"
import {
  Button,
  Card,
  CardTitle,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  toast,
} from "@skill-platform/ui"
import { cn } from "@skill-platform/ui/lib/utils"
import { useSkill, useSkillVersions } from "./hooks/useSkill"
import { getCategoryLabel } from "../../../config/categories"
import {
  installSkill,
  downloadAsset,
  installSkillFile,
  linkSkill,
  detectInstalledAgents,
} from "../../../services/installs"
import type { DetectedAgent } from "../../../services/installs"
import { Agent, AGENTS } from "../../../config/agents"
import { getErrorMessage } from "../../../utils/error"

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function formatDate(date: Date | string | null | undefined, locale: string): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")
}

function formatConfigValue(value: unknown): string {
  if (value === null || value === undefined) return "-"
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  return JSON.stringify(value)
}

export function SkillDetail() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [installing, setInstalling] = React.useState(false)
  const [selectedAgents, setSelectedAgents] = React.useState<Agent[]>([Agent.ClaudeCode])
  const [detectedAgents, setDetectedAgents] = React.useState<DetectedAgent[]>([])

  React.useEffect(() => {
    detectInstalledAgents()
      .then((agents) => {
        setDetectedAgents(agents)
        const installed = agents.filter((a) => a.installed).map((a) => a.id)
        if (installed.length > 0) {
          setSelectedAgents(installed)
        }
      })
      .catch(() => {})
  }, [])

  const toggleAgent = (agentId: Agent) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    )
  }

  const { data: skill, isLoading: skillLoading, error: skillError } = useSkill(id)
  const { data: versions, isLoading: versionsLoading } = useSkillVersions(id)

  if (skillLoading || versionsLoading) {
    return <div className="p-8 text-sm text-geist-text-muted">{t("actions.loading")}</div>
  }

  if (skillError || !skill) {
    return <div className="p-8 text-sm text-geist-error">{t("errors.loadFailed", { message: skillError?.message ?? t("status.notFound") })}</div>
  }

  const latestVersion =
    versions && versions.length > 0
      ? versions.find((v) => v.isLatest) ??
      [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : undefined
  const inputSchema = latestVersion?.inputSchema ?? []
  const outputSchema = latestVersion?.outputSchema ?? []
  const runtimeConfig = latestVersion?.runtimeConfig ?? {}
  const evaluation = latestVersion?.evaluation ?? {}
  const dependencies = latestVersion?.dependencies ?? []
  const permissions = latestVersion?.permissions ?? []
  const assetRefs = latestVersion?.assetRefs ?? []

  const handleInstall = async () => {
    if (!id || !latestVersion) {
      toast({
        toastType: "error",
        title: t("skillDetail.cannotInstall"),
        description: t("skillDetail.noInstallableVersion"),
      })
      return
    }

    setInstalling(true)
    try {
      await installSkill({
        skillId: id,
        version: latestVersion.version,
        targetAppId: "desktop",
        targetEnv: "dev",
        customConfig: (latestVersion.runtimeConfig as Record<string, unknown>) ?? {},
        permissions,
      })

      const downloads =
        assetRefs.length > 0
          ? await Promise.all(
            assetRefs.map(async (asset) => {
              const filename = asset.path.split("/").pop() ?? asset.path
              const blob = await downloadAsset(id, latestVersion.version, filename)
              const bytes = new Uint8Array(await blob.arrayBuffer())
              return { relPath: filename, bytes }
            })
          )
          : []

      const skillId = skill.skillId
      await Promise.all(downloads.map((d) => installSkillFile(skillId, latestVersion.version, d.relPath, d.bytes)))

      await Promise.all(selectedAgents.map((a) => linkSkill(a, skillId)))

      const agentLabels = selectedAgents
        .map((agentId) => AGENTS.find((a) => a.id === agentId)?.label ?? agentId)
        .join(", ")
      toast({
        toastType: "success",
        title: t("skillDetail.installComplete"),
        description:
          downloads.length > 0
            ? t("skillDetail.installCompleteWithFiles", { count: downloads.length, agents: agentLabels })
            : t("skillDetail.installCompleteNoFiles", { agents: agentLabels }),
      })
    } catch (err) {
      toast({
        toastType: "error",
        title: t("skillDetail.installFailed"),
        description: getErrorMessage(err, t),
      })
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="flex h-full flex-col p-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex w-fit items-center gap-1 text-sm text-geist-text-muted hover:text-geist-text"
      >
        <ArrowLeftIcon />
        <span>{t("skillDetail.back")}</span>
      </button>

      <Card className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-geist-surface-secondary text-2xl text-geist-text">
              {skill.iconUrl ? (
                <img src={skill.iconUrl} alt={skill.name} className="h-8 w-8" />
              ) : (
                <span>📦</span>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-geist-text">{skill.name}</h1>
                {skill.latestVersion && <Badge label={skill.latestVersion} variant="primary" />}
                {skill.status && <Badge label={skill.status} variant="outline" />}
              </div>
              <p className="mt-1 text-sm text-geist-text-muted">
                {skill.author ?? t("skillDetail.author")}
                {skill.category && ` · ${getCategoryLabel(skill.category) ?? skill.category}`}
                {skill.subCategory && ` · ${getCategoryLabel(skill.subCategory) ?? skill.subCategory}`}
                {!skill.category && !skill.subCategory && ` · ${t("skillDetail.uncategorized")}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {AGENTS.map((agent) => {
                const installed = detectedAgents.find((a) => a.id === agent.id)?.installed ?? false
                const checked = selectedAgents.includes(agent.id)
                return (
                  <label
                    key={agent.id}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs shadow-geist-border",
                      installed ? "hover:bg-geist-surface-secondary" : "cursor-not-allowed opacity-50"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-geist-foreground"
                      checked={checked}
                      disabled={!installed}
                      onChange={() => toggleAgent(agent.id)}
                    />
                    <span className="flex items-center gap-1 text-geist-text">
                      {agent.label}
                      {installed && <span className="h-1.5 w-1.5 rounded-full bg-geist-success" title={t("skillDetail.agentInstalled")} />}
                    </span>
                  </label>
                )
              })}
            </div>
            <Button className="h-9" disabled={installing || selectedAgents.length === 0} onClick={handleInstall}>
              {installing ? t("actions.installing") : t("skillDetail.installSkill")}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-geist-border pt-4 text-sm text-geist-text-muted">
          {skill.skillId && <span>{t("skillDetail.id")}: {skill.skillId}</span>}
          {skill.runtimeType && <span>{t("skillDetail.runtime")}: {skill.runtimeType}</span>}
          {skill.visibility && <span>{t("skillDetail.visibility")}: {skill.visibility}</span>}
          {skill.tags && skill.tags.length > 0 && <span>{t("skillDetail.tags")}: {skill.tags.join(", ")}</span>}
          {skill.createdAt && <span>{t("skillDetail.createdAt")}: {formatDate(skill.createdAt, i18n.language)}</span>}
          {skill.updatedAt && <span>{t("skillDetail.updatedAt")}: {formatDate(skill.updatedAt, i18n.language)}</span>}
        </div>

        {skill.shortDescription && <p className="text-sm text-geist-text">{skill.shortDescription}</p>}
      </Card>

      <Card className="mt-6 flex flex-col gap-4 p-6">
        <CardTitle className="text-base text-geist-text">{t("skillDetail.detailTitle")}</CardTitle>
        <p className="text-sm leading-relaxed text-geist-text-secondary">{skill.description ?? t("status.noDescription")}</p>
      </Card>

      <Card className="mt-6 flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <CardTitle className="text-base text-geist-text">{t("skillDetail.inputTitle")}</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("skillDetail.inputName")}</TableHead>
                <TableHead>{t("skillDetail.inputType")}</TableHead>
                <TableHead>{t("skillDetail.inputRequired")}</TableHead>
                <TableHead>{t("skillDetail.inputDescription")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inputSchema.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-geist-text-muted">
                    {t("skillDetail.noInputDefinition")}
                  </TableCell>
                </TableRow>
              ) : (
                inputSchema.map((field, index) => (
                  <TableRow key={String(field.name ?? index)}>
                    <TableCell className="font-mono text-geist-text">{String(field.name ?? "")}</TableCell>
                    <TableCell className="font-mono text-geist-text-muted">{String(field.type ?? "")}</TableCell>
                    <TableCell className="text-geist-text">
                      {"required" in field && field.required ? t("actions.yes") : t("actions.no")}
                    </TableCell>
                    <TableCell className="text-geist-text-secondary">{String(field.description ?? "")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-4">
          <CardTitle className="text-base text-geist-text">{t("skillDetail.outputTitle")}</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("skillDetail.inputName")}</TableHead>
                <TableHead>{t("skillDetail.inputType")}</TableHead>
                <TableHead>{t("skillDetail.inputDescription")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outputSchema.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-geist-text-muted">
                    {t("skillDetail.noOutputDefinition")}
                  </TableCell>
                </TableRow>
              ) : (
                outputSchema.map((field, index) => (
                  <TableRow key={String(field.name ?? index)}>
                    <TableCell className="font-mono text-geist-text">{String(field.name ?? "")}</TableCell>
                    <TableCell className="font-mono text-geist-text-muted">{String(field.type ?? "")}</TableCell>
                    <TableCell className="text-geist-text-secondary">{String(field.description ?? "")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="mt-6 flex flex-col gap-4 p-6">
        <CardTitle className="text-base text-geist-text">{t("skillDetail.runtimeConfig")}</CardTitle>
        <div className="space-y-3">
          {Object.keys(runtimeConfig).length === 0 ? (
            <p className="text-sm text-geist-text-muted">{t("skillDetail.noRuntimeConfig")}</p>
          ) : (
            Object.entries(runtimeConfig).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-geist-text-muted">{key}</span>
                <span className="font-mono text-geist-text">{formatConfigValue(value)}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-6">
          <CardTitle className="text-base text-geist-text">{t("skillDetail.dependencies")}</CardTitle>
          <div className="space-y-2">
            {dependencies.length === 0 ? (
              <p className="text-sm text-geist-text-muted">{t("skillDetail.noDependencies")}</p>
            ) : (
              dependencies.map((dep, index) => (
                <p key={`${dep.skill}-${dep.version}-${index}`} className="font-mono text-sm text-geist-text">
                  {dep.skill} {dep.version}
                </p>
              ))
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <CardTitle className="text-base text-geist-text">{t("skillDetail.permissions")}</CardTitle>
          <div className="space-y-2">
            {permissions.length === 0 ? (
              <p className="text-sm text-geist-text-muted">{t("skillDetail.noPermissions")}</p>
            ) : (
              permissions.map((perm, index) => (
                <p key={`${perm}-${index}`} className="font-mono text-sm text-geist-text">
                  {perm}
                </p>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4 flex flex-col gap-4 p-6">
        <CardTitle className="text-base text-geist-text">{t("skillDetail.evaluation")}</CardTitle>
        <div className="space-y-3">
          {Object.keys(evaluation).length === 0 ? (
            <p className="text-sm text-geist-text-muted">{t("skillDetail.noEvaluation")}</p>
          ) : (
            Object.entries(evaluation).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg bg-geist-surface-secondary p-4 text-sm shadow-geist-border"
              >
                <span className="text-geist-text-muted">{key}</span>
                <span className="font-mono font-semibold text-geist-text">{String(value)}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="mt-4 flex flex-col gap-4 p-6">
        <CardTitle className="text-base text-geist-text">{t("skillDetail.assets")}</CardTitle>
        <div className="space-y-2">
          {assetRefs.length === 0 ? (
            <p className="text-sm text-geist-text-muted">{t("skillDetail.noAssets")}</p>
          ) : (
            assetRefs.map((asset, index) => (
              <div key={`${asset.type}-${asset.path}-${index}`} className="flex items-center justify-between text-sm">
                <span className="font-mono text-geist-text">{asset.path}</span>
                <Badge label={asset.type} variant="secondary" />
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="mt-4 flex flex-col gap-4 p-6">
        <CardTitle className="text-base text-geist-text">{t("skillDetail.versionHistory")}</CardTitle>
        <div className="space-y-4">
          {versions?.length === 0 ? (
            <p className="text-sm text-geist-text-muted">{t("skillDetail.noVersions")}</p>
          ) : (
            versions?.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between border-b border-geist-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-geist-text">{version.version}</span>
                  {version.isLatest && <Badge label={t("skillDetail.latestBadge")} variant="primary" />}
                  <span className="text-sm text-geist-text-muted">{version.status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-geist-text-muted">{formatDate(version.publishedAt, i18n.language)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

export default SkillDetail
