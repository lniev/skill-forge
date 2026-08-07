import { fetch as tauriFetch } from "@tauri-apps/plugin-http"
import { z } from "zod"
import { extractSkillText } from "../../utils/zip"
import { useSettingsStore } from "../../store/settingsStore"

const defaultApiBaseUrl = import.meta.env.VITE_AI_API_URL ?? ""
const defaultApiKey = import.meta.env.VITE_AI_API_KEY ?? ""

const skillSchema = z.object({
  name: z.string().describe("Skill 名称"),
  skillId: z.string().describe("Skill 唯一标识"),
  version: z.string().describe("版本号，例如 1.0.0"),
  author: z.string().describe("作者或团队"),
  category: z.string().describe("分类，可选值：nlp/classification, nlp/extraction, nlp/generation, nlp/summarization, nlp/translation, code/script, data/transform, workflow, vision, audio, customer-service, operations, supply-chain, sales, marketing, hr, finance, legal, it"),
  subCategory: z.string().optional().describe("业务场景子分类，例如 customer-service"),
  runtimeType: z.enum(["llm_prompt", "python_script", "api_call", "workflow"]).describe("运行时类型"),
  tags: z.array(z.string()).describe("标签数组"),
  icon: z.string().optional().describe("图标，应为 Base64 Data URL（如 data:image/svg+xml;base64,...），建议生成简洁的 SVG 图标并编码为 Base64"),
  shortDescription: z.string().describe("一句话描述"),
  description: z.string().describe("详细描述"),
  inputs: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
        description: z.string(),
      })
    )
    .describe("输入定义"),
  outputs: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        description: z.string(),
      })
    )
    .describe("输出定义"),
  model: z.string().optional().describe("运行时模型"),
  temperature: z.string().optional().describe("温度参数"),
  visibility: z.enum(["public", "team", "private"]).describe("可见性"),
  dependencies: z.array(z.string()).optional().describe("依赖列表"),
  permissions: z.array(z.string()).optional().describe("权限列表"),
  evaluation: z.string().optional().describe("评测标准"),
})

export type SkillAnalysisResult = z.infer<typeof skillSchema>

function buildAnalyzePrompt(content: string): string {
  return `请分析以下 Skill 文件内容，提取并返回标准的 Skill 元信息、输入输出定义、运行时配置等。

文件内容：
${content}

请尽可能提取准确的信息，如果某个字段无法从文件中推断，请使用合理的默认值。

特别地，请根据 Skill 内容生成一个简洁、贴切的 SVG 图标，使用单一主题色、透明背景，将其编码为 Base64 Data URL 填入 icon 字段。格式示例：data:image/svg+xml;base64,PHN2Zy8+...。图标尺寸建议 64x64 像素。

重要：请直接返回 JSON 对象，不要包含 markdown 代码块或其他说明文字。JSON 格式如下：

{
  "name": "Skill 名称",
  "skillId": "唯一标识",
  "version": "1.0.0",
  "author": "作者",
  "category": "nlp/classification",
  "runtimeType": "llm_prompt",
  "tags": ["标签1", "标签2"],
  "icon": "data:image/svg+xml;base64,PHN2Z...", // 根据 Skill 内容生成的 SVG 图标 Base64 Data URL
  "shortDescription": "一句话描述",
  "description": "详细描述",
  "inputs": [
    { "name": "字段名", "type": "string", "required": true, "description": "描述" }
  ],
  "outputs": [
    { "name": "字段名", "type": "string", "description": "描述" }
  ],
  "model": "gpt-4o",
  "temperature": "0.3",
  "visibility": "team",
  "dependencies": ["dep1"],
  "permissions": ["read:chat"],
  "evaluation": "评测标准"
}`
}

async function chatCompletions(content: string, signal?: AbortSignal): Promise<unknown> {
  const { aiApiUrl, aiApiKey, aiModel } = useSettingsStore.getState()
  const effectiveUrl = aiApiUrl || defaultApiBaseUrl
  const effectiveKey = aiApiKey || defaultApiKey
  const effectiveModel = aiModel || "kimi-k2.6"

  if (!effectiveUrl || !effectiveKey) {
    throw new Error("AI API URL 或 API Key 未配置，请前往设置页面配置")
  }

  const response = await tauriFetch(`${effectiveUrl}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${effectiveKey}`,
    },
    body: JSON.stringify({
      model: effectiveModel,
      messages: [
        {
          role: "user",
          content: buildAnalyzePrompt(content),
        },
      ],
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`AI 请求失败：${response.status} ${response.statusText} ${text}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const contentText = data.choices?.[0]?.message?.content
  if (!contentText) {
    throw new Error("AI 返回内容为空")
  }

  // eslint-disable-next-line no-console
  console.log("[AI raw content]", contentText)

  return parseAiJson(contentText)
}

function parseAiJson(text: string): unknown {
  const trimmed = text.trim()

  // 去掉 ```json ... ``` 或 ``` ... ``` 代码块
  const codeBlockMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim())
  }

  // 尝试提取第一个 { ... } 或 [ ... ]
  const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/) ?? []
  if (jsonMatch[1]) {
    return JSON.parse(jsonMatch[1].trim())
  }

  return JSON.parse(trimmed)
}

export async function analyzeSkillContent(
  content: string,
  signal?: AbortSignal
): Promise<SkillAnalysisResult> {
  const raw = await chatCompletions(content, signal)
  return skillSchema.parse(raw)
}

export async function analyzeSkillFile(
  file: File,
  signal?: AbortSignal
): Promise<SkillAnalysisResult> {
  const content = await extractSkillText(file)
  return analyzeSkillContent(content, signal)
}
