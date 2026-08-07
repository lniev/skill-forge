export interface CategoryOption {
  id: string
  label: string
}

export const TECH_CATEGORIES: CategoryOption[] = [
  { id: "nlp/classification", label: "NLP/分类" },
  { id: "nlp/extraction", label: "信息提取" },
  { id: "nlp/generation", label: "文本生成" },
  { id: "nlp/summarization", label: "文本摘要" },
  { id: "nlp/translation", label: "翻译" },
  { id: "code/script", label: "代码脚本" },
  { id: "data/transform", label: "数据处理" },
  { id: "workflow", label: "工作流" },
  { id: "vision", label: "视觉/图像" },
  { id: "audio", label: "语音/音频" },
]

export const BUSINESS_CATEGORIES: CategoryOption[] = [
  { id: "customer-service", label: "客服" },
  { id: "operations", label: "运营" },
  { id: "supply-chain", label: "供应链" },
  { id: "sales", label: "销售" },
  { id: "marketing", label: "市场" },
  { id: "hr", label: "人力资源" },
  { id: "finance", label: "财务" },
  { id: "legal", label: "法务" },
  { id: "it", label: "IT/研发" },
]

const ALL_CATEGORIES = [...TECH_CATEGORIES, ...BUSINESS_CATEGORIES]

export function getCategoryLabel(id: string | null | undefined): string | undefined {
  if (!id) return undefined
  return ALL_CATEGORIES.find((c) => c.id === id)?.label ?? id
}
