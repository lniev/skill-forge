import { unzip } from "fflate"

export interface ExtractedFile {
  name: string
  data: Uint8Array
}

function normalizePath(path: string): string {
  return path.replace(/^\/+/, "").replace(/\\/g, "/")
}

function findEntryName(entries: string[], target: string): string | undefined {
  const normalizedTarget = normalizePath(target).toLowerCase()
  return entries.find((name) => normalizePath(name).toLowerCase() === normalizedTarget)
}

export async function extractZip(file: File): Promise<ExtractedFile[]> {
  const buffer = new Uint8Array(await file.arrayBuffer())

  return new Promise((resolve, reject) => {
    unzip(buffer, (err, data) => {
      if (err) {
        reject(new Error(`解压失败：${err.message ?? err}`))
        return
      }

      const files: ExtractedFile[] = Object.entries(data).map(([name, bytes]) => ({
        name,
        data: bytes,
      }))

      resolve(files)
    })
  })
}

export async function extractSkillMdFromZip(file: File): Promise<string> {
  const files = await extractZip(file)

  if (files.length === 0) {
    throw new Error("压缩包为空")
  }

  const names = files.map((f) => f.name)

  // 优先查找根目录或任意层级的 skill.md
  let entryName = findEntryName(names, "SKILL.md")

  // // 兼容 index.md / README.md
  if (!entryName) {
    entryName = findEntryName(names, "skill.md")
  }

  // 如果只有一个 .md 文件，直接用它
  if (!entryName) {
    const mdFiles = files.filter((f) => f.name.toLowerCase().endsWith(".md"))
    if (mdFiles.length === 1) {
      entryName = mdFiles[0].name
    }
  }

  if (!entryName) {
    throw new Error("压缩包中未找到 skill.md 或 Markdown 主文档")
  }

  const entry = files.find((f) => f.name === entryName)
  if (!entry) {
    throw new Error(`找不到文件：${entryName}`)
  }

  return new TextDecoder().decode(entry.data)
}

export async function readTextFile(file: File): Promise<string> {
  return file.text()
}

export async function extractSkillText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase()

  if (extension === "zip") {
    return extractSkillMdFromZip(file)
  }

  if (extension === "md" || extension === "markdown") {
    return readTextFile(file)
  }

  throw new Error("不支持的文件格式，请上传 .md 或 .zip 文件")
}
