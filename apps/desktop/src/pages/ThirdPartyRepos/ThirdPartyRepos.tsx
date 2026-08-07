import * as React from "react"
import { useTranslation } from "react-i18next"
import { open } from "@tauri-apps/plugin-shell"
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
  Badge,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@skill-platform/ui"
import { cn } from "@skill-platform/ui/lib/utils"
import { getErrorMessage } from "../../utils/error"
import {
  type SkillRepo,
  type DiscoverableSkill,
  getSkillRepos,
  saveSkillRepos,
  addSkillRepo,
  removeSkillRepo,
  discoverSkills,
  installDiscoveredSkill,
  readSkillReadme,
  openExternalUrl,
  searchSkillsSh,
} from "../../services/discovery"
import { AGENTS, Agent } from "../../config/agents"

const PAGE_SIZE = 12

function RepoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.42-1.34 6.42-7A4.58 4.58 0 0 0 20 4.58 4.57 4.57 0 0 0 18 2.92h-.46a6.3 6.3 0 0 0-4.54 0H12a4.57 4.57 0 0 0-2 1.66A4.58 4.58 0 0 0 8.5 6.14C8.5 9.4 11.7 10.4 14.84 10.75a3.37 3.37 0 0 0-.94 2.61V17" />
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
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

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("h-4 w-4", className)}>
      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M21 22v-6h-6M3 12a9 9 0 0 0 15 6.7L21 16" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

interface SkillCardProps {
  skill: DiscoverableSkill
  installing?: boolean
  onInstall: (skill: DiscoverableSkill, agent: Agent) => void
  onView: (skill: DiscoverableSkill) => void
}

function SkillCard({ skill, installing, onInstall, onView }: SkillCardProps) {
  const { t } = useTranslation()
  const [selectedAgent, setSelectedAgent] = React.useState<Agent>(Agent.ClaudeCode)

  return (
    <Card className="mb-4 flex h-[320px] break-inside-avoid flex-col overflow-hidden transition-shadow hover:shadow-geist-card-hover">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-geist-surface-secondary text-geist-text shadow-geist-border">
            <PackageIcon />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-2 text-base font-semibold leading-tight text-geist-text">
              {skill.name}
            </CardTitle>
            <CardDescription className="mt-0.5 line-clamp-1 text-xs">
              {skill.directory}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden pt-0">
        <p className="line-clamp-4 text-sm leading-relaxed text-geist-text-secondary">
          {skill.description || t("status.noDescription")}
        </p>
      </CardContent>
      <CardFooter className="mt-auto flex flex-col items-stretch gap-3 pt-0">
        <div className="flex items-center gap-2">
          <Badge label={`${skill.repoOwner}/${skill.repoName}`} variant="secondary" className="text-[10px]" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 shrink-0 p-0"
            onClick={() => onView(skill)}
            aria-label={t("thirdPartyRepos.view")}
            title={t("thirdPartyRepos.view")}
          >
            <ExternalIcon />
          </Button>
          <Select value={selectedAgent} onValueChange={(value) => setSelectedAgent(value as Agent)}>
            <SelectTrigger className="h-8 w-28 shrink-0 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGENTS.map((agent) => (
                <SelectItem key={agent.id} value={agent.id} className="text-xs">
                  {agent.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="flex-1"
            disabled={installing}
            onClick={() => onInstall(skill, selectedAgent)}
          >
            {installing ? t("actions.installing") : t("actions.install")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function LoadMoreSentinel({ onLoadMore }: { onLoadMore: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          onLoadMore()
        }
      },
      { rootMargin: "200px" }
    )


    observer.observe(element)
    return () => observer.disconnect()
  }, [onLoadMore])

  return <div ref={ref} className="h-4 w-full" />
}

export default function ThirdPartyRepos() {
  const { t } = useTranslation()

  const [repos, setRepos] = React.useState<SkillRepo[]>([])
  const [skills, setSkills] = React.useState<DiscoverableSkill[]>([])
  const [loadingRepos, setLoadingRepos] = React.useState(true)
  const [loadingSkills, setLoadingSkills] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isRepoDialogOpen, setIsRepoDialogOpen] = React.useState(false)
  const [newRepoUrl, setNewRepoUrl] = React.useState("")
  const [newRepoBranch, setNewRepoBranch] = React.useState("main")
  const [activeSource, setActiveSource] = React.useState<"repos" | "skillssh">("repos")
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)
  const [installingKey, setInstallingKey] = React.useState<string | null>(null)
  const [viewingSkill, setViewingSkill] = React.useState<DiscoverableSkill | null>(null)
  const [readmeContent, setReadmeContent] = React.useState<string | null>(null)
  const [loadingReadme, setLoadingReadme] = React.useState(false)

  const [skillsShInput, setSkillsShInput] = React.useState("")
  const [skillsShQuery, setSkillsShQuery] = React.useState("")
  const [skillsShResults, setSkillsShResults] = React.useState<DiscoverableSkill[]>([])
  const [skillsShTotal, setSkillsShTotal] = React.useState(0)
  const [skillsShOffset, setSkillsShOffset] = React.useState(0)
  const [loadingSkillsSh, setLoadingSkillsSh] = React.useState(false)

  React.useEffect(() => {
    getSkillRepos()
      .then((data) => {
        console.log("[discovery] loaded repos:", data)
        setRepos(data)
        setLoadingRepos(false)
      })
      .catch((err) => {
        console.error("[discovery] load repos failed:", err)
        toast({ toastType: "error", title: t("thirdPartyRepos.loadReposFailed"), description: getErrorMessage(err, t) })
        setLoadingRepos(false)
      })
  }, [t])

  React.useEffect(() => {
    if (!loadingRepos && repos.length > 0) {
      handleDiscover()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingRepos, repos.length])

  const handleDiscover = async () => {
    console.log("[discovery] starting discovery...")
    setLoadingSkills(true)
    try {
      const data = await discoverSkills()
      console.log("[discovery] discovered:", data.length, data)
      setSkills(data)
    } catch (err) {
      console.error("[discovery] discover failed:", err)
      toast({ toastType: "error", title: t("thirdPartyRepos.discoverFailed"), description: getErrorMessage(err, t) })
    } finally {
      setLoadingSkills(false)
    }
  }

  function parseRepoUrl(input: string): { owner: string; name: string; host: string; protocol: string } | null {
    const trimmed = input.trim().replace(/\/$/, "")
    if (!trimmed) return null

    const httpsMatch = trimmed.match(/^(https?):\/\/([^\/]+)\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/|\?|#|$)/)
    if (httpsMatch) {
      return {
        protocol: httpsMatch[1],
        host: httpsMatch[2],
        owner: httpsMatch[3],
        name: httpsMatch[4].replace(/\.git$/, ""),
      }
    }

    const gitMatch = trimmed.match(/^git@([^:]+):([^\/]+)\/([^\/]+?)(?:\.git)?$/)
    if (gitMatch) {
      return {
        host: gitMatch[1],
        owner: gitMatch[2],
        name: gitMatch[3].replace(/\.git$/, ""),
        protocol: "https",
      }
    }

    const shortMatch = trimmed.match(/^([^\/:\s]+)\/([^\/:\s]+?)(?:\.git)?$/)
    if (shortMatch) {
      return {
        owner: shortMatch[1],
        name: shortMatch[2].replace(/\.git$/, ""),
        host: "github.com",
        protocol: "https",
      }
    }

    return null
  }

  const handleAddRepo = async () => {
    const parsed = parseRepoUrl(newRepoUrl)
    if (!parsed) {
      toast({ toastType: "error", title: t("thirdPartyRepos.invalidRepoUrl"), description: t("thirdPartyRepos.invalidRepoUrlHint") })
      return
    }
    try {
      const branch = newRepoBranch.trim() || "main"
      await addSkillRepo(parsed.owner, parsed.name, branch, parsed.host, parsed.protocol)
      const updated = await getSkillRepos()
      setRepos(updated)
      setNewRepoUrl("")
      setNewRepoBranch("main")
      setIsRepoDialogOpen(false)
      toast({ toastType: "success", title: t("thirdPartyRepos.addRepoSuccess") })
    } catch (err) {
      toast({ toastType: "error", title: t("thirdPartyRepos.addRepoFailed"), description: getErrorMessage(err, t) })
    }
  }

  const handleRemoveRepo = async (owner: string, name: string, host: string) => {
    try {
      await removeSkillRepo(owner, name, host)
      const updated = await getSkillRepos()
      setRepos(updated)
      toast({ toastType: "success", title: t("thirdPartyRepos.removeRepoSuccess") })
    } catch (err) {
      toast({ toastType: "error", title: t("thirdPartyRepos.removeRepoFailed"), description: getErrorMessage(err, t) })
    }
  }

  const handleToggleRepo = async (index: number) => {
    const updated = [...repos]
    updated[index] = { ...updated[index], enabled: !updated[index].enabled }
    try {
      await saveSkillRepos(updated)
      setRepos(updated)
    } catch (err) {
      toast({ toastType: "error", title: t("thirdPartyRepos.saveRepoFailed"), description: getErrorMessage(err, t) })
    }
  }

  const handleSkillsShSearch = async (newOffset = 0) => {
    const trimmed = skillsShInput.trim()
    if (trimmed.length < 2) {
      toast({ toastType: "error", title: t("thirdPartyRepos.searchMinChars") })
      return
    }
    setLoadingSkillsSh(true)
    try {
      const data = await searchSkillsSh(trimmed, PAGE_SIZE, newOffset)
      setSkillsShQuery(trimmed)
      setSkillsShResults((prev) =>
        newOffset === 0 ? data.skills : [...prev, ...data.skills]
      )
      setSkillsShTotal(data.totalCount)
      setSkillsShOffset(newOffset)
    } catch (err) {
      toast({ toastType: "error", title: t("thirdPartyRepos.searchFailed"), description: getErrorMessage(err, t) })
    } finally {
      setLoadingSkillsSh(false)
    }
  }

  const handleSkillsShLoadMore = () => {
    const nextOffset = skillsShOffset + PAGE_SIZE
    if (nextOffset < skillsShTotal) {
      handleSkillsShSearch(nextOffset)
    }
  }

  const handleInstall = async (skill: DiscoverableSkill, agent: Agent) => {
    setInstallingKey(skill.key)
    try {
      const skillId = await installDiscoveredSkill(skill, agent)
      toast({ toastType: "success", title: t("thirdPartyRepos.installSuccess"), description: t("thirdPartyRepos.installSuccessDescription", { skillId }) })
    } catch (err) {
      toast({ toastType: "error", title: t("thirdPartyRepos.installFailed"), description: getErrorMessage(err, t) })
    } finally {
      setInstallingKey(null)
    }
  }

  const handleViewSkill = async (skill: DiscoverableSkill) => {
    setViewingSkill(skill)
    setLoadingReadme(true)
    try {
      const content = await readSkillReadme(skill)
      setReadmeContent(content)
    } catch (err) {
      toast({ toastType: "error", title: t("thirdPartyRepos.readmeLoadFailed"), description: getErrorMessage(err, t) })
      setReadmeContent(null)
    } finally {
      setLoadingReadme(false)
    }
  }

  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [searchQuery])

  const filteredSkills = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return skills
    return skills.filter((skill) =>
      skill.name.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query) ||
      skill.repoOwner.toLowerCase().includes(query) ||
      skill.repoName.toLowerCase().includes(query)
    )
  }, [skills, searchQuery])

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-[-1.2px] text-geist-text">{t("thirdPartyRepos.title")}</h1>
        <p className="mt-2 text-geist-text-secondary">{t("thirdPartyRepos.subtitle")}</p>
      </div>

      <div className="mb-6 inline-flex w-fit gap-1 rounded-lg border border-geist-border bg-white p-1 shadow-geist-border">
        <button
          type="button"
          onClick={() => {
            setActiveSource("repos")
            setVisibleCount(PAGE_SIZE)
          }}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
            activeSource === "repos"
              ? "bg-geist-foreground text-white shadow-sm"
              : "text-geist-text-secondary hover:bg-geist-surface-secondary"
          )}
        >
          {t("thirdPartyRepos.sourceRepos")}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSource("skillssh")
            setVisibleCount(PAGE_SIZE)
          }}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
            activeSource === "skillssh"
              ? "bg-geist-foreground text-white shadow-sm"
              : "text-geist-text-secondary hover:bg-geist-surface-secondary"
          )}
        >
          {t("thirdPartyRepos.sourceSkillsSh")}
        </button>
      </div>

      {activeSource === "repos" ? (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex w-full items-center sm:w-96">
              <span className="pointer-events-none absolute left-3 text-geist-text-muted">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("thirdPartyRepos.searchPlaceholder")}
                className="flex h-9 w-full rounded-md bg-transparent px-3 py-2 pl-9 text-sm shadow-geist-border outline-none transition-colors placeholder:text-geist-text-muted focus-visible:ring-2 focus-visible:ring-geist-focus"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setIsRepoDialogOpen(true)} className="gap-1.5">
                <RepoIcon />
                {t("thirdPartyRepos.manageRepos")}
              </Button>
              <Button onClick={handleDiscover} disabled={loadingSkills} className="gap-1.5">
                <RefreshIcon className={cn(loadingSkills && "animate-spin")} />
                {loadingSkills ? t("actions.discovering") : t("thirdPartyRepos.discover")}
              </Button>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {loadingRepos ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              repos.map((repo, index) => (
                <div
                  key={`${repo.owner}/${repo.name}`}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-opacity",
                    repo.enabled
                      ? "border-geist-border bg-white text-geist-text shadow-geist-border"
                      : "border-geist-border bg-geist-surface-secondary text-geist-text-muted opacity-60"
                  )}
                >
                  <span
                    className={cn("h-2 w-2 rounded-full", repo.enabled ? "bg-green-500" : "bg-gray-300")}
                  />
                  <span>{repo.owner}/{repo.name}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleRepo(index)}
                    className="ml-1 text-geist-text-muted hover:text-geist-text"
                  >
                    {repo.enabled ? t("actions.disable") : t("actions.enable")}
                  </button>
                </div>
              ))
            )}
          </div>

          {loadingSkills ? (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <Card key={i} className="mb-4 break-inside-avoid p-5">
                  <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="mb-2 h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </Card>
              ))}
            </div>
          ) : skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-geist-border bg-geist-surface-secondary py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-geist-border">
                <RepoIcon />
              </div>
              <p className="text-base font-medium text-geist-text">{t("thirdPartyRepos.noSkillsFound")}</p>
              <p className="mt-1 text-sm text-geist-text-secondary">{t("thirdPartyRepos.noSkillsHint")}</p>
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="py-12 text-center text-sm text-geist-text-muted">{t("thirdPartyRepos.noSearchResults")}</div>
          ) : (
            <>
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {filteredSkills.slice(0, visibleCount).map((skill) => (
                  <SkillCard
                    key={skill.key}
                    skill={skill}
                    installing={installingKey === skill.key}
                    onInstall={handleInstall}
                    onView={handleViewSkill}
                  />
                ))}
              </div>
              {visibleCount < filteredSkills.length && (
                <LoadMoreSentinel onLoadMore={() => setVisibleCount((prev) => prev + PAGE_SIZE)} />
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex w-full items-center sm:w-96">
              <span className="pointer-events-none absolute left-3 text-geist-text-muted">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={skillsShInput}
                onChange={(e) => setSkillsShInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSkillsShSearch(0)
                  }
                }}
                placeholder={t("thirdPartyRepos.searchSkillsShPlaceholder")}
                className="flex h-9 w-full rounded-md bg-transparent px-3 py-2 pl-9 text-sm shadow-geist-border outline-none transition-colors placeholder:text-geist-text-muted focus-visible:ring-2 focus-visible:ring-geist-focus"
              />
            </div>
            <Button
              onClick={() => handleSkillsShSearch(0)}
              disabled={loadingSkillsSh}
              className="gap-1.5"
            >
              <RefreshIcon className={cn(loadingSkillsSh && "animate-spin")} />
              {loadingSkillsSh ? t("actions.search") : t("actions.search")}
            </Button>
          </div>

          {loadingSkillsSh && skillsShResults.length === 0 ? (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <Card key={i} className="mb-4 break-inside-avoid p-5">
                  <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="mb-2 h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </Card>
              ))}
            </div>
          ) : skillsShQuery.length < 2 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-geist-border bg-geist-surface-secondary py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-geist-border">
                <SearchIcon />
              </div>
              <p className="text-base font-medium text-geist-text">{t("thirdPartyRepos.searchSkillsShTitle")}</p>
              <p className="mt-1 text-sm text-geist-text-secondary">{t("thirdPartyRepos.searchSkillsShHint")}</p>
            </div>
          ) : skillsShResults.length === 0 ? (
            <div className="py-12 text-center text-sm text-geist-text-muted">
              {t("thirdPartyRepos.noResultsFor", { query: skillsShQuery })}
            </div>
          ) : (
            <>
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {skillsShResults.slice(0, visibleCount).map((skill) => (
                  <SkillCard
                    key={skill.key}
                    skill={skill}
                    installing={installingKey === skill.key}
                    onInstall={handleInstall}
                    onView={handleViewSkill}
                  />
                ))}
              </div>
              {skillsShResults.length < skillsShTotal && (
                <LoadMoreSentinel onLoadMore={handleSkillsShLoadMore} />
              )}
            </>
          )}
        </>
      )}

      <Dialog open={isRepoDialogOpen} onOpenChange={setIsRepoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("thirdPartyRepos.manageReposTitle")}</DialogTitle>
            <DialogDescription>{t("thirdPartyRepos.manageReposDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder={t("thirdPartyRepos.repoUrlPlaceholder")}
                value={newRepoUrl}
                onChange={(e) => setNewRepoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddRepo()
                  }
                }}
              />
              <p className="text-xs text-geist-text-muted">
                {t("thirdPartyRepos.repoUrlHint")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="shrink-0 text-sm text-geist-text">{t("thirdPartyRepos.branch")}</label>
              <Input
                placeholder={t("thirdPartyRepos.branchPlaceholder")}
                value={newRepoBranch}
                onChange={(e) => setNewRepoBranch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddRepo()
                  }
                }}
                className="flex-1"
              />
            </div>
            <Button onClick={handleAddRepo} className="w-full gap-1">
              <PlusIcon />
              {t("actions.add")}
            </Button>

            <div className="divide-y divide-geist-border rounded-lg border border-geist-border">
              {repos.map((repo) => (
                <div
                  key={`${repo.host}/${repo.owner}/${repo.name}`}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-geist-text">
                      {repo.owner}/{repo.name}
                    </p>
                    <p className="text-xs text-geist-text-muted">{repo.host} · {repo.branch}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRepo(repo.owner, repo.name, repo.host)}
                    className="text-geist-error hover:bg-red-50"
                  >
                    <TrashIcon />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRepoDialogOpen(false)}>
              {t("actions.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewingSkill}
        onOpenChange={(open) => {
          if (!open) {
            setViewingSkill(null)
            setReadmeContent(null)
          }
        }}
      >
        <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{viewingSkill?.name}</DialogTitle>
            <DialogDescription>
              {viewingSkill && `${viewingSkill.repoOwner}/${viewingSkill.repoName} · ${viewingSkill.directory}`}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] min-h-[200px] flex-1 overflow-y-auto py-4">
            {loadingReadme ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : readmeContent ? (
              <pre className="whitespace-pre-wrap break-words rounded-lg bg-geist-surface-secondary p-4 text-sm leading-relaxed text-geist-text">
                {readmeContent}
              </pre>
            ) : (
              <p className="text-center text-sm text-geist-text-muted">{t("thirdPartyRepos.readmeEmpty")}</p>
            )}
          </div>

          <DialogFooter>
            <div className="flex w-full items-center justify-between gap-3">
              {viewingSkill && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={async () => {
                    const url = `${viewingSkill.repoProtocol}://${viewingSkill.repoHost}/${viewingSkill.repoOwner}/${viewingSkill.repoName}`
                    try {
                      await openExternalUrl(url)
                    } catch (err) {
                      toast({ toastType: "error", title: t("thirdPartyRepos.openFailed"), description: getErrorMessage(err, t) })
                    }
                  }}
                >
                  <ExternalIcon />
                  {t("thirdPartyRepos.openRepo")}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setViewingSkill(null)
                  setReadmeContent(null)
                }}
              >
                {t("actions.close")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
