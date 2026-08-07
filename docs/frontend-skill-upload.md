# 前端 Skill 上传接口调用文档

本页面说明前端在上传 Skill 页面中，「保存为草稿」和「立即发布」分别如何调用后端接口。

## 接口基础信息

### 创建 Skill + 第一个版本

```
POST /api/skills/create-with-version
```

支持两种请求方式：

- `application/json`：只传元数据
- `multipart/form-data`：同时传元数据和附件文件

带文件时必须使用 `multipart/form-data`。

### 发布版本

```
POST /api/skills/:id/versions/:version/publish
```

- 将 version 状态改为 `stable`
- 标记为 `isLatest`
- 将 skill 状态改为 `published`
- 更新 skill 的 `latestVersion`

---

## 1. 保存为草稿

### 业务含义

只把表单内容和文件存到后端，但不发布。Skill 和 Version 的状态都默认是 `draft`。

### 请求示例

#### 不带文件

```ts
import { request } from "@/services/request"

const payload = {
  skill: {
    skillId: "xiaohongshu-copy",
    name: "小红书文案生成",
    shortDescription: "帮用户撰写小红书风格文案",
    description: "自动撰写小红书风格文案，生成标题、正文、话题标签与发布建议。",
    author: "fde-team",
    category: "文案",
    subCategory: "社交媒体",
    tags: ["小红书", "文案生成", "社交媒体"],
    runtimeType: "llm_prompt",
    visibility: "team",
  },
  version: {
    version: "1.0.0",
    runtimeConfig: {
      model: "gpt-4o",
      temperature: 0.7,
    },
    inputSchema: [
      { name: "theme", type: "string", required: true, description: "主题/产品" },
    ],
    outputSchema: [
      { name: "titles", type: "string", description: "标题建议" },
    ],
    dependencies: [],
    permissions: ["read:chat"],
    evaluation: { quality: "文案是否符合小红书平台调性" },
  },
}

const res = await request.post("/skills/create-with-version", {
  body: JSON.stringify(payload),
  headers: { "Content-Type": "application/json" },
}).json<{ success: boolean; data: { skill: Skill; version: SkillVersion } }>()
```

#### 带文件

```ts
const files: File[] = [promptFile, iconFile]

const formData = new FormData()
formData.append("data", JSON.stringify(payload))
files.forEach((file) => formData.append("file", file))

const res = await request.post("/skills/create-with-version", {
  body: formData,
}).json<{ success: boolean; data: { skill: Skill; version: SkillVersion; assets: StoredAsset[] } }>()
```

### 返回结果

```json
{
  "success": true,
  "data": {
    "skill": {
      "id": "342562029564854272",
      "skillId": "xiaohongshu-copy",
      "name": "小红书文案生成",
      "status": "draft",
      ...
    },
    "version": {
      "id": "342562029564854273",
      "version": "1.0.0",
      "status": "draft",
      "assetRefs": [
        { "type": "prompt", "path": "skills/xiaohongshu-copy/1.0.0/prompt.txt" }
      ],
      ...
    },
    "assets": [
      { "type": "prompt", "path": "skills/xiaohongshu-copy/1.0.0/prompt.txt", "size": 123 }
    ]
  }
}
```

### 前端处理

保存草稿成功后：

- 提示用户「草稿已保存」
- 可以留在当前页面继续编辑
- 也可以跳转到 Skill 列表页

---

## 2. 立即发布

### 业务含义

先创建 Skill + Version（默认 `draft`），再调用发布接口把版本状态改为 `stable`，并更新 Skill 状态为 `published`。

### 完整流程

```
┌─────────────────────┐
│  POST /skills/create-with-version  │
│  创建 skill + version（draft）      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  POST /skills/:id/versions/:version/publish  │
│  发布版本                            │
└─────────────────────┘
```

### 代码示例

```ts
import { request } from "@/services/request"

async function publishSkill(formData: SkillForm, files: File[]) {
  // 1. 创建 skill + version（草稿）
  const formDataBody = new FormData()
  formDataBody.append("data", JSON.stringify({
    skill: {
      skillId: formData.skillId,
      name: formData.name,
      shortDescription: formData.shortDescription,
      description: formData.description,
      author: formData.author,
      category: formData.category,
      subCategory: formData.subCategory,
      tags: formData.tags,
      runtimeType: formData.runtimeType,
      visibility: formData.visibility,
    },
    version: {
      version: formData.version,
      runtimeConfig: {
        model: formData.model,
        temperature: formData.temperature,
      },
      inputSchema: formData.inputs,
      outputSchema: formData.outputs,
      dependencies: formData.dependencies,
      permissions: formData.permissions,
      evaluation: formData.evaluation,
    },
  }))

  files.forEach((file) => formDataBody.append("file", file))

  const createRes = await request
    .post("/skills/create-with-version", { body: formDataBody })
    .json<{ success: boolean; data: { skill: Skill; version: SkillVersion } }>()

  if (!createRes.success) {
    throw new Error("创建失败")
  }

  const { skill, version } = createRes.data

  // 2. 发布版本
  const publishRes = await request
    .post(`/skills/${skill.id}/versions/${version.version}/publish`)
    .json<{ success: boolean; data: SkillVersion }>()

  if (!publishRes.success) {
    throw new Error("发布失败")
  }

  return { skill, version: publishRes.data }
}
```

### 为什么不直接传 `status: "published"`？

`create-with-version` 只负责创建数据，不会触发发布逻辑。如果前端直接传：

```json
{
  "skill": { "status": "published" },
  "version": { "status": "stable" }
}
```

虽然状态能存进去，但以下字段不会被正确更新：

- `skill.latestVersion`
- `version.isLatest`
- `version.publishedAt`

这会导致列表页、详情页显示异常。

所以「发布」必须走专门的 `publish` 接口。

---

## 3. 表单字段映射

### Skill 元信息

| 表单字段 | 接口字段 | 说明 |
|---|---|---|
| Skill 名称 | `skill.name` | 必填 |
| Skill ID | `skill.skillId` | 必填，URL 友好 |
| 一句话描述 | `skill.shortDescription` | 可选 |
| 详细描述 | `skill.description` | 可选 |
| 作者 | `skill.author` | 可选 |
| 分类 | `skill.category` | 可选 |
| 标签 | `skill.tags` | 可选，数组 |
| 运行时类型 | `skill.runtimeType` | 可选 |
| 可见性 | `skill.visibility` | 可选：`public` / `private` / `team` |

### Version 信息

| 表单字段 | 接口字段 | 说明 |
|---|---|---|
| 版本 | `version.version` | 必填，如 `1.0.0` |
| 运行时配置 | `version.runtimeConfig` | 可选，如 `{ model, temperature }` |
| 输入定义 | `version.inputSchema` | 可选，数组 |
| 输出定义 | `version.outputSchema` | 可选，数组 |
| 依赖 | `version.dependencies` | 可选，数组 |
| 权限 | `version.permissions` | 可选，数组 |
| 评测标准 | `version.evaluation` | 可选，对象 |

### 附件文件

通过 `FormData.append("file", file)` 上传，可传多个。

---

## 4. 注意事项

1. **文件名冲突**：同一版本下文件名不能重复，后上传的文件会覆盖先上传的。
2. **文件大小**：建议前端做大小限制，例如单个文件不超过 20MB。
3. **Content-Type**：使用 `FormData` 时，不要手动设置 `Content-Type`，让浏览器自动设置 `multipart/form-data` 和 boundary。
4. **错误处理**：`create-with-version` 可能返回 `409`（`skillId` 已存在），前端需要捕获并提示。

---

## 5. 简化方案（可选）

如果觉得两个接口麻烦，可以封装一个 `saveOrPublishSkill` 函数：

```ts
export async function saveOrPublishSkill(
  payload: { skill: SkillPayload; version: VersionPayload },
  files: File[],
  mode: "draft" | "publish"
) {
  const formData = new FormData()
  formData.append("data", JSON.stringify(payload))
  files.forEach((file) => formData.append("file", file))

  const { skill, version } = await request
    .post("/skills/create-with-version", { body: formData })
    .json<{ success: boolean; data: { skill: Skill; version: SkillVersion } }>()
    .then((res) => {
      if (!res.success) throw new Error("创建失败")
      return res.data
    })

  if (mode === "publish") {
    await request.post(`/skills/${skill.id}/versions/${version.version}/publish`)
  }

  return { skill, version }
}
```

调用方式：

```ts
// 保存草稿
await saveOrPublishSkill(payload, files, "draft")

// 立即发布
await saveOrPublishSkill(payload, files, "publish")
```
