import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button, Card, Badge, Pagination, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Skeleton, toast } from "@skill-platform/ui"
import { cn } from "@skill-platform/ui/lib/utils"
import { useSkills } from "./hooks/useSkills"
import { TECH_CATEGORIES, getCategoryLabel } from "../../config/categories"
import {
  installSkill,
  installSkillFile,
  downloadAsset,
  writeSkillMeta,
  linkSkill,
} from "../../services/installs"
import { getSkillVersion } from "../../services/skills"
import { queryClient } from "../../lib/queryClient"
import { getErrorMessage } from "../../utils/error"
import type { SkillListItem } from "@skill-platform/api"
import { Agent } from "../../config/agents"

const PAGE_SIZE = 12

type SortOption = "hot" | "newest" | "mostUsed"

function useSortOptions() {
  const { t } = useTranslation()
  return [
    { value: "hot" as SortOption, label: t("skills.sort.hot") },
    { value: "newest" as SortOption, label: t("skills.sort.newest") },
    { value: "mostUsed" as SortOption, label: t("skills.sort.mostUsed") },
  ]
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-geist-error">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("h-4 w-4", className)}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("h-4 w-4", className)}>
      <polyline points="6 15 12 9 18 15" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("h-3.5 w-3.5", className)}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function Skills() {
  const { t } = useTranslation()
  const sortOptions = useSortOptions()
  const navigate = useNavigate()

  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [query, setQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState<SortOption>("hot")

  const offset = (currentPage - 1) * PAGE_SIZE

  const params = React.useMemo(
    () => ({
      query: query.trim() || undefined,
      category: selectedCategories.length > 0 ? selectedCategories.join(",") : undefined,
      sort: sortBy,
      limit: PAGE_SIZE,
      offset,
    }),
    [query, selectedCategories, sortBy, offset]
  )

  const { data, isLoading, error } = useSkills(params)

  const skills = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setCurrentPage(1)
  }

  const hasFilters = selectedCategories.length > 0

  const [installingSkillId, setInstallingSkillId] = React.useState<string | null>(null)

  const formatErr = (err: unknown): string => {
    return getErrorMessage(err, t)
  }

  const handleInstall = async (skill: SkillListItem) => {
    if (!skill.latestVersion) {
      toast({ toastType: "error", title: t("skills.installFailed"), description: t("skills.noVersion") })
      return
    }
    setInstallingSkillId(skill.id)
    try {
      await installSkill({
        skillId: skill.id,
        version: skill.latestVersion,
      })

      const versionRecord = await getSkillVersion(skill.id, skill.latestVersion)

      if (versionRecord.assetRefs && versionRecord.assetRefs.length > 0) {
        for (const asset of versionRecord.assetRefs) {
          const blob = await downloadAsset(skill.id, skill.latestVersion, asset.path)
          const arrayBuffer = await blob.arrayBuffer()
          await installSkillFile(skill.skillId, skill.latestVersion, asset.path, new Uint8Array(arrayBuffer))
        }
      }

      await writeSkillMeta(skill.skillId, {
        id: skill.id,
        name: skill.name,
        version: skill.latestVersion,
        author: skill.author,
        category: skill.category,
        subCategory: skill.subCategory,
        tags: skill.tags,
        iconUrl: skill.iconUrl,
        shortDescription: skill.shortDescription,
        description: skill.description,
        runtimeType: skill.runtimeType,
        installedAt: new Date().toISOString(),
        source: "marketplace",
        targetEnv: "dev",
      })

      await linkSkill(Agent.ClaudeCode, skill.skillId)

      await queryClient.invalidateQueries({ queryKey: ["skills"] })
      toast({ toastType: "success", title: t("skills.installed"), description: t("skills.installedDescription", { name: skill.name }) })
    } catch (err) {
      toast({
        toastType: "error",
        title: t("skills.installFailed"),
        description: formatErr(err) || t("actions.unknownError"),
      })
    } finally {
      setInstallingSkillId(null)
    }
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-[-1.2px] text-geist-text">{t("skills.title")}</h1>
        <p className="mt-2 text-geist-text-secondary">{t("skills.subtitle")}</p>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex w-full items-center sm:w-96">
            <span className="pointer-events-none absolute left-3 text-geist-text-muted">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder={t("skills.searchPlaceholder")}
              className="flex h-9 w-full rounded-md bg-transparent px-3 py-2 pl-9 text-sm shadow-geist-border outline-none transition-colors placeholder:text-geist-text-muted focus-visible:ring-2 focus-visible:ring-geist-focus"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value as SortOption)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-9 w-32 text-sm shadow-geist-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => navigate("/my-skills")}
              className="flex h-9 shrink-0 items-center gap-1.5"
            >
              {t("skills.mySkills")}
            </Button>
            <Button
              onClick={() => navigate("/skills/upload")}
              className="flex h-9 shrink-0 items-center gap-1.5"
            >
              <UploadIcon />
              {t("skills.uploadSkill")}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-geist-text">{t("actions.filter")}</span>
            <button
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-geist-text-muted hover:bg-geist-surface-secondary"
            >
              {isFilterOpen ? t("actions.hideTags") : t("actions.showTags")}
              {isFilterOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-geist-text-muted hover:bg-geist-surface-secondary"
            >
              <XIcon />
              {t("actions.clearFilters")}
            </button>
          )}
        </div>

        {isFilterOpen && (
          <div className="flex flex-col gap-3 rounded-lg bg-geist-surface-secondary p-4 shadow-geist-border">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-sm font-medium text-geist-text">{t("skills.categoryType")}</span>
              <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
                {TECH_CATEGORIES.map((category) => {
                  const active = selectedCategories.includes(category.id)
                  return (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        active
                          ? "bg-geist-foreground text-white"
                          : "bg-white text-geist-text shadow-geist-border hover:bg-geist-surface-secondary"
                      )}
                    >
                      {getCategoryLabel(category.id)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div className="text-sm text-geist-error">{getErrorMessage(error, t)}</div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Card key={i} className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      ) : skills.length === 0 ? (
        <div className="text-sm text-geist-text-muted">{t("skills.noSkills")}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill: SkillListItem) => (
            <Card
              key={skill.id}
              className="flex h-full cursor-pointer flex-col gap-4 p-5 transition-shadow hover:shadow-geist-card-hover"
              onClick={() => navigate(`/skill/${skill.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-geist-surface-secondary text-lg text-geist-text">
                  {skill.iconUrl ? (
                    <img src={skill.iconUrl} alt={skill.name} className="h-6 w-6" />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <Badge label={skill.latestVersion ?? "v0.0"} variant="default" />
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="line-clamp-1 text-base font-semibold text-geist-text">{skill.name}</h3>
                <p className="line-clamp-3 min-h-[3.5em] text-sm leading-relaxed text-geist-text-secondary">
                  {skill.shortDescription || skill.description || t("status.noDescription")}
                </p>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-xs text-geist-text-muted">
                {skill.category && (
                  <span className="rounded-full bg-geist-surface-secondary px-2 py-0.5 text-geist-text shadow-geist-border">
                    {getCategoryLabel(skill.category)}
                  </span>
                )}
                {skill.subCategory && (
                  <span className="rounded-full bg-geist-surface-secondary px-2 py-0.5 text-geist-text shadow-geist-border">
                    {getCategoryLabel(skill.subCategory)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <DownloadIcon />
                  {skill.downloadCount ?? 0}
                </span>
              </div>

              <Button
                variant="default"
                size="sm"
                className="w-full"
                disabled={installingSkillId === skill.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleInstall(skill)
                }}
              >
                {installingSkillId === skill.id ? t("actions.installing") : t("actions.install")}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        className="mt-6"
      />
    </div>
  )
}
