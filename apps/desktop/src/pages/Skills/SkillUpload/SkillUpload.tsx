import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Button,
  Card,
  CardTitle,
  Input,
  Textarea,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton,
  toast,
} from "@skill-platform/ui"
import { cn } from "@skill-platform/ui/lib/utils"
import { TECH_CATEGORIES, getCategoryLabel } from "../../../config/categories"
import { CloudUploadIcon, FileIcon, TrashIcon, PlusIcon, ChevronDownIcon } from "./icons"
import { extractZip } from "../../../utils/zip"
import { analyzeSkillFile, type SkillAnalysisResult } from "../../../services/ai"
import type { SkillVersion } from "@skill-platform/api"
import {
  createSkillWithVersion,
  publishSkillVersion,
  getSkill,
  getEditVersion,
  updateSkill,
  updateSkillVersion,
  type CreateSkillWithVersionRequest,
} from "../../../services/skills"
import { queryClient } from "../../../lib/queryClient"
import { getErrorMessage } from "../../../utils/error"

interface SchemaField {
  id: string
  name: string
  type: string
  required?: boolean
  description: string
}

interface SkillForm {
  name: string
  skillId: string
  version: string
  author: string
  category: string
  subCategory: string
  runtimeType: string
  tags: string
  icon: string
  shortDescription: string
  description: string
  model: string
  temperature: string
  visibility: string
  dependencies: string
  permissions: string
  evaluation: string
}

const typeOptions = ["string", "number", "float", "boolean", "array"]

const visibilityOptions = [
  { value: "public", label: "public" },
  { value: "team", label: "team" },
  { value: "private", label: "private" },
]

const initialForm: SkillForm = {
  name: "",
  skillId: "",
  version: "1.0.0",
  author: "",
  category: "",
  subCategory: "",
  runtimeType: "llm_prompt",
  tags: "",
  icon: "",
  shortDescription: "",
  description: "",
  model: "gpt-4o",
  temperature: "0.3",
  visibility: "public",
  dependencies: "",
  permissions: "",
  evaluation: "",
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function parseList(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseDependencies(value: string): Array<{ skill: string; version: string }> {
  return parseList(value).map((line) => {
    const match = line.match(/^(.+?)(?:>=|<=|==|~=|>|<|~)(.+)$/)
    if (match) {
      return { skill: match[1].trim(), version: match[2].trim() }
    }
    return { skill: line, version: "*" }
  })
}

function parseEvaluation(value: string): Record<string, string> {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>
    }
  } catch {
    // 非 JSON 时当作普通文本处理
  }
  return { description: value }
}

export default function SkillUpload() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editSkillId = searchParams.get("id")
  const isEditMode = Boolean(editSkillId)
  const [isLoadingEdit, setIsLoadingEdit] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null)
  const [form, setForm] = React.useState<SkillForm>(initialForm)
  const [inputs, setInputs] = React.useState<SchemaField[]>([])
  const [outputs, setOutputs] = React.useState<SchemaField[]>([])
  const [analyzing, setAnalyzing] = React.useState(false)
  const [analysisError, setAnalysisError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [zipEntries, setZipEntries] = React.useState<{ name: string; size: number }[]>([])
  const [isFileListOpen, setIsFileListOpen] = React.useState(false)
  const [existingAssets, setExistingAssets] = React.useState<Array<{ type: string; path: string }>>([])
  const abortControllerRef = React.useRef<AbortController | null>(null)

  const runtimeTypes = [
    { value: "llm_prompt", label: t("skillUpload.runtimeTypes.llm_prompt") },
    { value: "python_script", label: t("skillUpload.runtimeTypes.python_script") },
    { value: "api_call", label: t("skillUpload.runtimeTypes.api_call") },
    { value: "workflow", label: t("skillUpload.runtimeTypes.workflow") },
  ]

  React.useEffect(() => {
    if (!editSkillId) return

    async function loadSkill() {
      setIsLoadingEdit(true)
      try {
        const [skill, version] = await Promise.all([getSkill(editSkillId!), getEditVersion(editSkillId!)])

        setForm({
          name: skill.name ?? "",
          skillId: skill.skillId ?? "",
          version: version.version ?? "",
          author: skill.author ?? "",
          category: skill.category ?? "",
          subCategory: skill.subCategory ?? "",
          runtimeType: skill.runtimeType ?? "llm_prompt",
          tags: skill.tags?.join(", ") ?? "",
          icon: skill.iconUrl ?? "",
          shortDescription: skill.shortDescription ?? "",
          description: skill.description ?? "",
          model: (version.runtimeConfig as { model?: string } | undefined)?.model ?? "gpt-4o",
          temperature:
            (version.runtimeConfig as { temperature?: number } | undefined)?.temperature?.toString() ?? "0.3",
          visibility: skill.visibility ?? "team",
          dependencies: version.dependencies?.map((d) => `${d.skill}>=${d.version}`).join("\n") ?? "",
          permissions: version.permissions?.join("\n") ?? "",
          evaluation: version.evaluation ? JSON.stringify(version.evaluation, null, 2) : "",
        })

        setInputs(
          (version.inputSchema as Array<{ name: string; type: string; required?: boolean; description?: string }>)?.map(
            (input) => ({
              id: generateId(),
              name: input.name,
              type: input.type,
              required: input.required,
              description: input.description ?? "",
            })
          ) ?? []
        )

        setExistingAssets(version.assetRefs ?? [])

        setOutputs(
          (version.outputSchema as Array<{ name: string; type: string; description?: string }>)?.map(
            (output) => ({
              id: generateId(),
              name: output.name,
              type: output.type,
              description: output.description ?? "",
            })
          ) ?? []
        )
      } catch (err) {
        toast({
          toastType: "error",
          title: t("skillUpload.loadFailed"),
          description: getErrorMessage(err, t),
        })
      } finally {
        setIsLoadingEdit(false)
      }
    }

    loadSkill()
  }, [editSkillId, t])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const applyAnalysisResult = (result: SkillAnalysisResult) => {
    setForm((prev) => ({
      ...prev,
      name: result.name ?? prev.name,
      skillId: result.skillId ?? prev.skillId,
      version: result.version ?? prev.version,
      author: result.author ?? prev.author,
      category: result.category ?? prev.category,
      subCategory: result.subCategory ?? prev.subCategory,
      runtimeType: result.runtimeType ?? prev.runtimeType,
      shortDescription: result.shortDescription ?? prev.shortDescription,
      description: result.description ?? prev.description,
      model: result.model ?? prev.model,
      temperature: result.temperature ?? prev.temperature,
      icon: result.icon ?? prev.icon,
      tags: Array.isArray(result.tags) ? result.tags.join(", ") : prev.tags,
      visibility: result.visibility ?? prev.visibility,
      dependencies: Array.isArray(result.dependencies) ? result.dependencies.join("\n") : prev.dependencies,
      permissions: Array.isArray(result.permissions) ? result.permissions.join("\n") : prev.permissions,
      evaluation: result.evaluation ?? prev.evaluation,
    }))

    if (result.inputs) {
      setInputs(
        result.inputs.map((input) => ({
          id: generateId(),
          name: input.name,
          type: input.type,
          required: input.required,
          description: input.description,
        }))
      )
    }

    if (result.outputs) {
      setOutputs(
        result.outputs.map((output) => ({
          id: generateId(),
          name: output.name,
          type: output.type,
          description: output.description,
        }))
      )
    }
  }

  const loadZipEntries = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setZipEntries([])
      return
    }

    try {
      const entries = await extractZip(file)
      setZipEntries(
        entries
          .filter((entry) => !entry.name.endsWith("/"))
          .map((entry) => ({ name: entry.name, size: entry.data.length }))
      )
    } catch {
      setZipEntries([])
    }
  }

  const processFile = async (file: File) => {
    setUploadedFile(file)
    setAnalyzing(true)
    setAnalysisError(null)
    setIsFileListOpen(false)

    await loadZipEntries(file)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const result = await analyzeSkillFile(file, controller.signal)
      applyAnalysisResult(result)
    } catch (err) {
      if (controller.signal.aborted) {
        return
      }
      setAnalysisError(err instanceof Error ? err.message : t("skillUpload.analyzeFailed"))
    } finally {
      setAnalyzing(false)
      abortControllerRef.current = null
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ""
  }

  const updateForm = (field: keyof SkillForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addField = (type: "input" | "output") => {
    const field: SchemaField = { id: generateId(), name: "", type: "string", description: "" }
    if (type === "input") {
      setInputs((prev) => [...prev, field])
    } else {
      setOutputs((prev) => [...prev, field])
    }
  }

  const updateField = (type: "input" | "output", id: string, key: keyof SchemaField, value: string | boolean) => {
    const updater = (prev: SchemaField[]) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    if (type === "input") {
      setInputs(updater)
    } else {
      setOutputs(updater)
    }
  }

  const removeField = (type: "input" | "output", id: string) => {
    if (type === "input") {
      setInputs((prev) => prev.filter((item) => item.id !== id))
    } else {
      setOutputs((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const buildPayload = (): CreateSkillWithVersionRequest => {
    const temperature = form.temperature ? parseFloat(form.temperature) : undefined

    return {
      skill: {
        skillId: form.skillId,
        name: form.name,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        author: form.author || undefined,
        category: form.category || undefined,
        subCategory: form.subCategory || undefined,
        tags: parseList(form.tags),
        iconUrl: form.icon || undefined,
        runtimeType: form.runtimeType as "llm_prompt" | "python_script" | "api_call" | "workflow",
        visibility: form.visibility as "public" | "private" | "team",
      },
      version: {
        version: form.version,
        runtimeConfig:
          form.model || temperature !== undefined
            ? {
              model: form.model,
              ...(temperature !== undefined && !Number.isNaN(temperature)
                ? { temperature }
                : {}),
            }
            : undefined,
        inputSchema: inputs.map(({ name, type, required, description }) => ({
          name,
          type,
          required,
          description,
        })),
        outputSchema: outputs.map(({ name, type, description }) => ({
          name,
          type,
          description,
        })),
        dependencies: parseDependencies(form.dependencies),
        permissions: parseList(form.permissions),
        evaluation: parseEvaluation(form.evaluation),
      },
    }
  }

  const buildSkillPayload = () => {
    const temperature = form.temperature ? parseFloat(form.temperature) : undefined
    return {
      name: form.name,
      shortDescription: form.shortDescription || undefined,
      description: form.description || undefined,
      author: form.author || undefined,
      category: form.category || undefined,
      subCategory: form.subCategory || undefined,
      tags: parseList(form.tags),
      iconUrl: form.icon || undefined,
      runtimeType: form.runtimeType as "llm_prompt" | "python_script" | "api_call" | "workflow",
      visibility: form.visibility as "public" | "private" | "team",
      runtimeConfig:
        form.model || temperature !== undefined
          ? {
            model: form.model,
            ...(temperature !== undefined && !Number.isNaN(temperature) ? { temperature } : {}),
          }
          : undefined,
    }
  }

  const buildVersionPayload = () => ({
    version: form.version,
    runtimeConfig:
      form.model || form.temperature
        ? {
          model: form.model,
          ...(form.temperature ? { temperature: parseFloat(form.temperature) } : {}),
        }
        : undefined,
    inputSchema: inputs.map(({ name, type, required, description }) => ({ name, type, required, description })),
    outputSchema: outputs.map(({ name, type, description }) => ({ name, type, description })),
    dependencies: parseDependencies(form.dependencies),
    permissions: parseList(form.permissions),
    evaluation: parseEvaluation(form.evaluation),
  })

  const handleSaveDraft = async () => {
    setIsSubmitting(true)
    try {
      if (isEditMode && editSkillId) {
        await updateSkill(editSkillId, buildSkillPayload())
        await updateSkillVersion(editSkillId, form.version, buildVersionPayload())
        toast({ toastType: "success", title: t("skillUpload.saveDraft") })
      } else {
        await createSkillWithVersion(buildPayload(), uploadedFile ? [uploadedFile] : [])
        toast({ toastType: "success", title: t("skillUpload.draftSaved") })
      }
      await queryClient.invalidateQueries({ queryKey: ["skills"] })
      navigate("/my-skills")
    } catch (err) {
      toast({
        toastType: "error",
        title: t("skillUpload.saveFailed"),
        description: getErrorMessage(err, t),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublish = async () => {
    setIsSubmitting(true)
    try {
      if (isEditMode && editSkillId) {
        await updateSkill(editSkillId, buildSkillPayload())
        await updateSkillVersion(editSkillId, form.version, buildVersionPayload())
        await publishSkillVersion(editSkillId, form.version)
        toast({ toastType: "success", title: t("skillUpload.published") })
        navigate(`/skill/${editSkillId}`)
      } else {
        const { skill, version } = await createSkillWithVersion(buildPayload(), uploadedFile ? [uploadedFile] : [])
        await publishSkillVersion(skill.id, version.version)
        toast({ toastType: "success", title: t("skillUpload.published") })
        navigate(`/skill/${skill.id}`)
      }
    } catch (err) {
      toast({
        toastType: "error",
        title: t("skillUpload.publishFailed"),
        description: getErrorMessage(err, t),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-auto p-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-[-1.2px] text-geist-text">
          {isEditMode ? t("skillUpload.editTitle") : t("skillUpload.title")}
        </h1>
        <p className="mt-2 text-geist-text-secondary">
          {isEditMode ? t("skillUpload.editSubtitle") : t("skillUpload.subtitle")}
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <Button type="button" variant="outline" onClick={() => navigate("/skills")}>
          {t("skillUpload.backToList")}
        </Button>
      </div>

      {isLoadingEdit && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!isEditMode && !uploadedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex shrink-0 flex-col items-center justify-center rounded-lg bg-geist-surface-secondary p-10 text-center transition-colors",
            isDragging
              ? "bg-geist-badge-blue-bg shadow-[0_0_0_1px_var(--geist-badge-blue-text)]"
              : "shadow-geist-border border-dashed border-2 border-transparent"
          )}
        >
          <CloudUploadIcon className="h-10 w-10 text-geist-badge-blue-text" />
          <p className="mt-4 text-sm font-medium text-geist-text">{t("skillUpload.dragDrop")}</p>
          <p className="mt-1 text-xs text-geist-text-muted">{t("skillUpload.supportedFormats")}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-md bg-white px-2 py-1 text-xs text-geist-text shadow-geist-border">.md</span>
            <span className="rounded-md bg-white px-2 py-1 text-xs text-geist-text shadow-geist-border">.zip</span>
          </div>
          <label className="mt-6 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-geist-foreground px-4 py-2 text-sm font-medium text-white hover:bg-geist-foreground/90">
            {t("skillUpload.chooseFile")}
            <input type="file" accept=".md,.zip" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      )}

      {uploadedFile && (
        <Card className="mt-6">
          <div className="flex items-center justify-between p-4">
            <div
              onClick={() =>
                uploadedFile.name.toLowerCase().endsWith(".zip") && setIsFileListOpen((prev) => !prev)
              }
              className={cn(
                "flex flex-1 items-center gap-4",
                uploadedFile.name.toLowerCase().endsWith(".zip") && "cursor-pointer"
              )}
            >
              <FileIcon className="h-8 w-8 text-geist-badge-blue-text" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-geist-text">{uploadedFile.name}</p>
                <p className="text-xs text-geist-text-muted">
                  {formatFileSize(uploadedFile.size)} · {uploadedFile.name.split(".").pop()?.toUpperCase()}
                </p>
              </div>
              {uploadedFile.name.toLowerCase().endsWith(".zip") && (
                <ChevronDownIcon
                  className={cn(
                    "h-4 w-4 shrink-0 text-geist-text-muted transition-transform",
                    isFileListOpen && "rotate-180"
                  )}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                abortControllerRef.current?.abort()
                abortControllerRef.current = null
                setUploadedFile(null)
                setZipEntries([])
                setIsFileListOpen(false)
                setAnalyzing(false)
                setAnalysisError(null)
              }}
              className="rounded-md p-2 text-geist-text-muted hover:bg-geist-surface-secondary hover:text-geist-text"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
          {isFileListOpen && zipEntries.length > 0 && (
            <div className="border-t border-geist-border bg-geist-surface-secondary/50 px-4 py-2">
              <ul className="max-h-60 overflow-auto text-sm">
                {zipEntries.map((entry) => (
                  <li key={entry.name} className="flex items-center justify-between py-1">
                    <span className="truncate text-geist-text">{entry.name}</span>
                    <span className="ml-4 shrink-0 text-xs text-geist-text-muted">{formatFileSize(entry.size)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {isEditMode && existingAssets.length > 0 && (
        <Card className="mt-6">
          <div className="flex items-center justify-between p-4">
            <div className="flex flex-1 items-center gap-4">
              <FileIcon className="h-8 w-8 text-geist-badge-blue-text" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-geist-text">{t("skillUpload.existingAssets")}</p>
                <p className="text-xs text-geist-text-muted">{existingAssets.length} {t("skillUpload.assetCount")}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-geist-border bg-geist-surface-secondary/50 px-4 py-2">
            <ul className="max-h-60 overflow-auto text-sm">
              {existingAssets.map((asset) => (
                <li key={asset.path} className="flex items-center justify-between py-1">
                  <span className="truncate text-geist-text">{asset.path}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {analyzing && (
        <div className="mt-6 rounded-lg bg-geist-surface-secondary p-4 text-sm text-geist-text-muted shadow-geist-border">
          {t("skillUpload.analyzing")}
        </div>
      )}

      {analysisError && (
        <div className="mt-6 rounded-lg bg-geist-error-bg p-4 text-sm text-geist-error shadow-geist-border">
          {analysisError}
        </div>
      )}

      {(isEditMode || uploadedFile) && !analyzing && (
        <Card className="mt-6 p-6">
          <div className="mb-4 flex items-center gap-2 text-geist-badge-blue-text">
            <CloudUploadIcon className="h-10 w-10 text-geist-badge-blue-text" />
            <h2 className="text-base font-semibold text-geist-text">{t("skillUpload.parsedMeta")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-geist-text-muted">{t("skillUpload.name")}</p>
              <p className="text-sm font-medium text-geist-text">{form.name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-geist-text-muted">{t("skillUpload.skillId")}</p>
              <p className="text-sm font-medium text-geist-text">{form.skillId || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-geist-text-muted">{t("skillUpload.version")}</p>
              <p className="text-sm font-medium text-geist-text">{form.version || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-geist-text-muted">{t("skillUpload.runtimeType")}</p>
              <p className="text-sm font-medium text-geist-text">
                {runtimeTypes.find((t) => t.value === form.runtimeType)?.label ?? form.runtimeType}
              </p>
            </div>
            <div>
              <p className="text-xs text-geist-text-muted">{t("skillUpload.author")}</p>
              <p className="text-sm font-medium text-geist-text">{form.author || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-geist-text-muted">{t("skillUpload.category")}</p>
              <p className="text-sm font-medium text-geist-text">
                {getCategoryLabel(form.category) ?? form.category}
              </p>
            </div>
          </div>
        </Card>
      )}

      {analyzing && uploadedFile && (
        <Card className="mt-6 p-6">
          <div className="mb-6 flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex flex-col gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {(isEditMode || uploadedFile) && !analyzing && (
        <Card className="mt-6 p-6">
          <div className="mb-6 flex items-center gap-2">
            <FileIcon className="h-8 w-8 text-geist-badge-blue-text" />
            <CardTitle className="text-base text-geist-text">{t("skillUpload.metaInfoTitle")}</CardTitle>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t("skillUpload.name")}</Label>
                <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("skillUpload.skillId")}</Label>
                <Input value={form.skillId} onChange={(e) => updateForm("skillId", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("skillUpload.version")}</Label>
                <Input value={form.version} onChange={(e) => updateForm("version", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t("skillUpload.author")}</Label>
                <Input value={form.author} onChange={(e) => updateForm("author", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("skillUpload.category")}</Label>
                <Select value={form.category} onValueChange={(value) => updateForm("category", value)}>
                  <SelectTrigger className="shadow-geist-border">
                    <SelectValue placeholder={t("skillUpload.selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {TECH_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("skillUpload.runtimeType")}</Label>
                <Select value={form.runtimeType} onValueChange={(value) => updateForm("runtimeType", value)}>
                  <SelectTrigger className="shadow-geist-border">
                    <SelectValue placeholder={t("skillUpload.selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {runtimeTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>{t("skillUpload.tags")}</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => updateForm("tags", e.target.value)}
                  placeholder={t("skillUpload.tagsPlaceholder")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("skillUpload.icon")}</Label>
                <div className="flex items-center gap-3">
                  <Input
                    value={form.icon}
                    onChange={(e) => updateForm("icon", e.target.value)}
                    placeholder={t("skillUpload.iconPlaceholder")}
                  />
                  {form.icon && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-geist-surface-secondary shadow-geist-border">
                      <img src={form.icon} alt="icon" className="h-full w-full object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t("skillUpload.shortDescription")}</Label>
              <Input value={form.shortDescription} onChange={(e) => updateForm("shortDescription", e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t("skillUpload.description")}</Label>
              <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} rows={4} />
            </div>
          </div>
        </Card>
      )}

      {(isEditMode || uploadedFile) && !analyzing && (
        <Card className="mt-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-geist-text">{t("skillUpload.inputDefinition")}</h2>
            <Button type="button" variant="secondary" size="sm" onClick={() => addField("input")}>
              <PlusIcon className="h-4 w-4" />
              {t("skillUpload.addInput")}
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {inputs.map((field) => (
              <div key={field.id} className="grid grid-cols-12 gap-3">
                <Input
                  value={field.name}
                  onChange={(e) => updateField("input", field.id, "name", e.target.value)}
                  placeholder={t("skillUpload.fieldName")}
                  className="col-span-3"
                />
                <Select value={field.type} onValueChange={(value) => updateField("input", field.id, "type", value)}>
                  <SelectTrigger className="col-span-2 shadow-geist-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={field.required ? "true" : "false"}
                  onValueChange={(value) => updateField("input", field.id, "required", value === "true")}
                >
                  <SelectTrigger className="col-span-2 shadow-geist-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t("actions.yes")}</SelectItem>
                    <SelectItem value="false">{t("actions.no")}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={field.description}
                  onChange={(e) => updateField("input", field.id, "description", e.target.value)}
                  placeholder={t("skillUpload.fieldDescription")}
                  className="col-span-4"
                />
                <button
                  onClick={() => removeField("input", field.id)}
                  className="col-span-1 flex items-center justify-center rounded-md text-geist-text-muted hover:text-geist-error"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            {inputs.length === 0 && <p className="text-sm text-geist-text-muted">{t("skillUpload.noInputDefinition")}</p>}
          </div>
        </Card>
      )}

      {(isEditMode || uploadedFile) && !analyzing && (
        <Card className="mt-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-geist-text">{t("skillUpload.outputDefinition")}</h2>
            <Button type="button" variant="secondary" size="sm" onClick={() => addField("output")}>
              <PlusIcon className="h-4 w-4" />
              {t("skillUpload.addOutput")}
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {outputs.map((field) => (
              <div key={field.id} className="grid grid-cols-12 gap-3">
                <Input
                  value={field.name}
                  onChange={(e) => updateField("output", field.id, "name", e.target.value)}
                  placeholder={t("skillUpload.fieldName")}
                  className="col-span-3"
                />
                <Select value={field.type} onValueChange={(value) => updateField("output", field.id, "type", value)}>
                  <SelectTrigger className="col-span-2 shadow-geist-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={field.description}
                  onChange={(e) => updateField("output", field.id, "description", e.target.value)}
                  placeholder={t("skillUpload.fieldDescription")}
                  className="col-span-6"
                />
                <button
                  onClick={() => removeField("output", field.id)}
                  className="col-span-1 flex items-center justify-center rounded-md text-geist-text-muted hover:text-geist-error"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            {outputs.length === 0 && <p className="text-sm text-geist-text-muted">{t("skillUpload.noOutputDefinition")}</p>}
          </div>
        </Card>
      )}

      {(isEditMode || uploadedFile) && !analyzing && (
        <Card className="mt-6 p-6">
          <h2 className="mb-4 text-base font-semibold text-geist-text">{t("skillUpload.runtimeConfig")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("skillUpload.model")}</Label>
              <Input value={form.model} onChange={(e) => updateForm("model", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("skillUpload.temperature")}</Label>
              <Input value={form.temperature} onChange={(e) => updateForm("temperature", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("skillUpload.visibility")}</Label>
              <Select value={form.visibility} onValueChange={(value) => updateForm("visibility", value)}>
                <SelectTrigger className="shadow-geist-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibilityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {(isEditMode || uploadedFile) && !analyzing && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold text-geist-text">{t("skillUpload.dependencies")}</h2>
            <Textarea
              value={form.dependencies}
              onChange={(e) => updateForm("dependencies", e.target.value)}
              placeholder={t("skillUpload.dependenciesPlaceholder")}
              rows={3}
            />
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold text-geist-text">{t("skillUpload.permissions")}</h2>
            <Textarea
              value={form.permissions}
              onChange={(e) => updateForm("permissions", e.target.value)}
              placeholder={t("skillUpload.permissionsPlaceholder")}
              rows={3}
            />
          </Card>
        </div>
      )}

      {(isEditMode || uploadedFile) && !analyzing && (
        <Card className="mt-6 p-6">
          <h2 className="mb-4 text-base font-semibold text-geist-text">{t("skillUpload.evaluation")}</h2>
          <Textarea value={form.evaluation} onChange={(e) => updateForm("evaluation", e.target.value)} rows={3} />
        </Card>
      )}

      {(isEditMode || uploadedFile) && !analyzing && (
        <div className="mt-8 flex items-center justify-between pb-8">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => navigate("/skills")}>
            {t("skillUpload.backToList")}
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={handleSaveDraft}>
              {isSubmitting ? t("skillUpload.saving") : t("skillUpload.saveDraft")}
            </Button>
            <Button type="button" disabled={isSubmitting} onClick={handlePublish}>
              {isSubmitting ? t("skillUpload.publishing") : t("skillUpload.publish")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
