import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  Button,
  Card,
  Badge,
  Pagination,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  toast,
} from "@skill-platform/ui"
import { cn } from "@skill-platform/ui/lib/utils"
import { useSkills } from "../Skills/hooks/useSkills"
import { useAuthStore } from "../../store/authStore"
import {
  updateSkill,
  deleteSkill,
  publishSkillVersion,
} from "../../services/skills"
import { queryClient } from "../../lib/queryClient"
import { getErrorMessage } from "../../utils/error"
import type { SkillListItem } from "@skill-platform/api"

type StatusTab = "all" | "published" | "draft" | "pending_review" | "deprecated"

const PAGE_SIZE = 12

function formatDate(date: Date | string | null | undefined, locale: string): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")
}

function getStatusLabel(status: string, t: (key: string) => string) {
  const map: Record<string, string> = {
    draft: t("mySkills.statusTabs.draft"),
    pending_review: t("mySkills.statusTabs.pending_review"),
    published: t("mySkills.statusTabs.published"),
    deprecated: t("mySkills.statusTabs.deprecated"),
  }
  return map[status] ?? status
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "primary" {
  switch (status) {
    case "published":
      return "primary"
    case "draft":
      return "default"
    case "pending_review":
      return "secondary"
    case "deprecated":
      return "outline"
    default:
      return "default"
  }
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export default function MySkills() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const STATUS_TABS: { id: StatusTab; label: string }[] = [
    { id: "all", label: t("mySkills.statusTabs.all") },
    { id: "published", label: t("mySkills.statusTabs.published") },
    { id: "draft", label: t("mySkills.statusTabs.draft") },
    { id: "pending_review", label: t("mySkills.statusTabs.pending_review") },
    { id: "deprecated", label: t("mySkills.statusTabs.deprecated") },
  ]

  const SORT_OPTIONS = [
    { value: "updatedAt", label: t("mySkills.sort.updatedAt") },
    { value: "createdAt", label: t("mySkills.sort.createdAt") },
    { value: "name", label: t("mySkills.sort.name") },
  ] as const

  const [currentPage, setCurrentPage] = React.useState(1)
  const [query, setQuery] = React.useState("")
  const [statusTab, setStatusTab] = React.useState<StatusTab>("all")
  const [sort, setSort] = React.useState<(typeof SORT_OPTIONS)[number]["value"]>("updatedAt")
  const [skillToDelete, setSkillToDelete] = React.useState<SkillListItem | null>(null)

  const offset = (currentPage - 1) * PAGE_SIZE

  const params = React.useMemo(
    () => ({
      query: query.trim() || undefined,
      userId: user?.id,
      status: statusTab === "all" ? undefined : statusTab,
      sort,
      limit: PAGE_SIZE,
      offset,
    }),
    [query, statusTab, sort, offset, user?.id]
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

  const invalidateSkills = () => {
    queryClient.invalidateQueries({ queryKey: ["skills"] })
  }

  const handlePublish = async (skill: SkillListItem) => {
      try {
        if (skill.latestVersion) {
          await publishSkillVersion(skill.id, skill.latestVersion)
        } else {
          await updateSkill(skill.id, { status: "published" })
        }
        toast({ toastType: "success", title: t("mySkills.publishSuccess") })
        invalidateSkills()
      } catch (err) {
        toast({
          toastType: "error",
          title: t("mySkills.publishFailed"),
          description: getErrorMessage(err, t),
        })
      }
    }

  const handleDeprecate = async (skill: SkillListItem) => {
    try {
      await updateSkill(skill.id, { status: "deprecated" })
      toast({ toastType: "success", title: t("mySkills.deprecateSuccess") })
      invalidateSkills()
    } catch (err) {
      toast({
        toastType: "error",
        title: t("mySkills.deprecateFailed"),
        description: getErrorMessage(err, t),
      })
    }
  }

  const handleDeleteClick = (skill: SkillListItem) => {
    setSkillToDelete(skill)
  }

  const handleConfirmDelete = async () => {
    if (!skillToDelete) return
    try {
      await deleteSkill(skillToDelete.id)
      toast({ toastType: "success", title: t("mySkills.deleteSuccess") })
      invalidateSkills()
    } catch (err) {
      toast({
        toastType: "error",
        title: t("mySkills.deleteFailed"),
        description: getErrorMessage(err, t),
      })
    } finally {
      setSkillToDelete(null)
    }
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-[-1.2px] text-geist-text">{t("mySkills.title")}</h1>
        <p className="mt-2 text-geist-text-secondary">{t("mySkills.subtitle")}</p>
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
              placeholder={t("mySkills.searchPlaceholder")}
              className="flex h-9 w-full rounded-md bg-transparent px-3 py-2 pl-9 text-sm shadow-geist-border outline-none transition-colors placeholder:text-geist-text-muted focus-visible:ring-2 focus-visible:ring-geist-focus"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={sort} onValueChange={(value) => setSort(value as (typeof SORT_OPTIONS)[number]["value"])}>
              <SelectTrigger className="h-9 w-36 text-sm shadow-geist-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => navigate("/skills/upload")} className="flex shrink-0 items-center gap-1.5">
              <PlusIcon />
              {t("mySkills.uploadSkill")}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusTab(tab.id)
                setCurrentPage(1)
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusTab === tab.id
                  ? "bg-geist-foreground text-white"
                  : "bg-white text-geist-text shadow-geist-border hover:bg-geist-surface-secondary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
        <div className="text-sm text-geist-text-muted">{t("mySkills.noSkills")}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <Card key={skill.id} className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-geist-surface-secondary text-lg text-geist-text">
                  {skill.iconUrl ? (
                    <img src={skill.iconUrl} alt={skill.name} className="h-6 w-6" />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <Badge label={getStatusLabel(skill.status, t)} variant={getStatusVariant(skill.status)} />
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="line-clamp-1 text-base font-semibold text-geist-text">{skill.name}</h3>
                <p className="text-xs text-geist-text-muted">{skill.skillId}</p>
              </div>

              <div className="text-sm text-geist-text-muted">
                <div className="flex items-center justify-between py-1">
                  <span>{t("mySkills.currentVersion")}</span>
                  <span className="font-medium text-geist-text">{skill.latestVersion ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>{t("mySkills.updatedAt")}</span>
                  <span className="font-medium text-geist-text">{formatDate(skill.updatedAt, i18n.language)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>{t("mySkills.downloads")}</span>
                  <span className="font-medium text-geist-text">{skill.downloadCount ?? 0}</span>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {(skill.status === "draft" || skill.status === "deprecated" || skill.status === "published") && (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/skills/upload?id=${skill.id}`)}>
                    {t("actions.edit")}
                  </Button>
                )}
                {skill.status === "published" && (
                  <Button size="sm" variant="outline" onClick={() => handleDeprecate(skill)}>
                    {t("mySkills.deprecate")}
                  </Button>
                )}
                {(skill.status === "draft" || skill.status === "pending_review" || skill.status === "deprecated") && (
                  <Button size="sm" onClick={() => handlePublish(skill)}>
                    {skill.status === "deprecated" ? t("mySkills.republish") : t("mySkills.publish")}
                  </Button>
                )}
                {(skill.status === "draft" || skill.status === "deprecated") && (
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(skill)}>
                    {t("actions.delete")}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-6" />

      <AlertDialog open={!!skillToDelete} onOpenChange={(open) => !open && setSkillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mySkills.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("mySkills.deleteConfirmDescription", { name: skillToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSkillToDelete(null)}>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-geist-foreground text-white hover:bg-geist-foreground/90">
              {t("actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
