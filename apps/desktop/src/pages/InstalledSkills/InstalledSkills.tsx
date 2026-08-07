import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button, Card, Badge, Skeleton, toast, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@skill-platform/ui"
import { cn } from "@skill-platform/ui/lib/utils"
import { useInstalledSkills } from "../../services/installs/useInstalledSkills"
import { openSkillDirectory, uninstallSkill } from "../../services/installs"
import { getCategoryLabel } from "../../config/categories"
import { queryClient } from "../../lib/queryClient"
import { getErrorMessage } from "../../utils/error"
import type { InstalledSkill as InstalledSkillType } from "../../services/installs"

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="18" r="2" />
    </svg>
  )
}

interface SkillCardProps {
  skill: InstalledSkillType
}

function SkillCard({ skill }: SkillCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const displayName = skill.name ?? skill.skillId
  const hasUpdate = false
  const [isUninstalling, setIsUninstalling] = React.useState(false)
  const [isOpening, setIsOpening] = React.useState(false)

  const handleOpenDirectory = async () => {
    setIsOpening(true)
    try {
      await openSkillDirectory(skill.skillId)
    } catch (err) {
      toast({
        toastType: "error",
        title: t("installedSkills.openDirectoryFailed"),
        description: getErrorMessage(err, t),
      })
    } finally {
      setIsOpening(false)
    }
  }

  const handleUninstall = async () => {
    if (!window.confirm(t("installedSkills.uninstallConfirm", { name: displayName }))) {
      return
    }
    setIsUninstalling(true)
    try {
      await uninstallSkill(skill.skillId, skill.linkedAgents ?? [])
      await queryClient.invalidateQueries({ queryKey: ["installed-skills"] })
      toast({ toastType: "success", title: t("installedSkills.uninstalled"), description: displayName })
    } catch (err) {
      toast({
        toastType: "error",
        title: t("installedSkills.uninstallFailed"),
        description: getErrorMessage(err, t),
      })
    } finally {
      setIsUninstalling(false)
    }
  }

  return (
    <Card className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-geist-surface-secondary text-lg text-geist-text">
          {skill.iconUrl ? (
            <img src={skill.iconUrl} alt={displayName} className="h-7 w-7" />
          ) : (
            <span>📦</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-geist-text">{displayName}</h3>
          <p className="truncate text-xs text-geist-text-muted">{skill.skillId}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {skill.category && (
          <Badge label={getCategoryLabel(skill.category) ?? skill.category} variant="default" />
        )}
        {skill.version && <Badge label={`v${skill.version}`} variant="secondary" />}
        {hasUpdate && <Badge label={t("installedSkills.updateAvailable")} variant="outline" />}
      </div>

      {skill.shortDescription ? (
        <p className="line-clamp-2 min-h-[2.5em] text-sm leading-relaxed text-geist-text-secondary">
          {skill.shortDescription}
        </p>
      ) : (
        <p className="line-clamp-2 min-h-[2.5em] text-sm italic text-geist-text-muted">{t("status.noDescription")}</p>
      )}

      <div className="text-sm text-geist-text-muted">
        {skill.author && (
          <div className="flex items-center justify-between py-0.5">
            <span>{t("installedSkills.author")}</span>
            <span className="font-medium text-geist-text">{skill.author}</span>
          </div>
        )}
        {skill.installedAt && (
          <div className="flex items-center justify-between py-0.5">
            <span>{t("installedSkills.installedAt")}</span>
            <span className="font-medium text-geist-text">{skill.installedAt}</span>
          </div>
        )}
        {skill.linkedAgents && skill.linkedAgents.length > 0 && (
          <div className="flex items-center justify-between py-0.5">
            <span>{t("installedSkills.linkedAgents")}</span>
            <span className="font-medium text-geist-text">{skill.linkedAgents.join(", ")}</span>
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-nowrap gap-2 pt-2">
        <Button
          size="sm"
          className="max-w-24 flex-1"
          onClick={() => {
            toast({ toastType: "info", title: t("actions.run"), description: t("installedSkills.runEntry", { name: displayName }) })
          }}
        >
          <PlayIcon />
          {t("actions.run")}
        </Button>
        {skill.source !== "third-party-repo" && (
          <Button
            size="sm"
            variant="outline"
            disabled={!skill.id}
            onClick={() => {
              if (skill.id) {
                navigate(`/skill/${skill.id}`)
              }
            }}
          >
            {t("actions.details")}
          </Button>
        )}
        <Button size="sm" variant="destructive" disabled={isUninstalling} onClick={handleUninstall}>
          <TrashIcon />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" aria-label={t("actions.more")}>
              <MoreIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={isOpening} onClick={handleOpenDirectory}>
              {t("actions.openDirectory")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}

export default function InstalledSkills() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = React.useState("")

  const { data: skills, isLoading, error } = useInstalledSkills()

  const filteredSkills = React.useMemo(() => {
    if (!skills) return []
    const q = query.trim().toLowerCase()
    if (!q) return skills
    return skills.filter(
      (skill) =>
        skill.skillId.toLowerCase().includes(q) ||
        (skill.name?.toLowerCase().includes(q) ?? false) ||
        (skill.category?.toLowerCase().includes(q) ?? false)
    )
  }, [skills, query])

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-[-1.2px] text-geist-text">{t("installedSkills.title")}</h1>
        <p className="mt-2 text-geist-text-secondary">{t("installedSkills.subtitle")}</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex w-full items-center sm:w-96">
          <span className="pointer-events-none absolute left-3 text-geist-text-muted">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("installedSkills.searchPlaceholder")}
            className="flex h-9 w-full rounded-md bg-transparent px-3 py-2 pl-9 text-sm shadow-geist-border outline-none transition-colors placeholder:text-geist-text-muted focus-visible:ring-2 focus-visible:ring-geist-focus"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/skills")}>
            {t("installedSkills.goToMarket")}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="text-sm text-geist-error">{getErrorMessage(error, t)}</div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="text-4xl">📦</div>
          <div className="text-sm text-geist-text-muted">
            {query ? t("installedSkills.emptyWithQuery") : t("installedSkills.empty")}
          </div>
          {!query && (
            <Button onClick={() => navigate("/skills")} className="mt-2">
              {t("installedSkills.installMarket")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => (
            <SkillCard key={skill.skillId} skill={skill} />
          ))}
        </div>
      )}
    </div>
  )
}
