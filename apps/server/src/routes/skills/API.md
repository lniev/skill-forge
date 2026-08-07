# Skill 仓库接口

所有接口以 `/api/skills` 为前缀。

## 通用说明

### 响应格式

所有接口统一返回：

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `success` | `boolean` | 请求是否成功 |
| `data` | `any` | 返回数据 |
| `message` | `string` | 错误时返回的提示信息 |

### 错误响应

失败时返回：

```json
{
  "success": false,
  "data": null,
  "message": "错误描述"
}
```

常见状态码：

| 状态码 | 说明 |
|---|---|
| `200` | 成功 |
| `201` | 创建成功 |
| `400` | 请求参数错误 |
| `404` | 资源不存在 |
| `409` | 资源冲突，例如 `skillId` 已存在 |
| `500` | 服务器内部错误 |

---

## GET /api/skills

查询 Skill 列表，支持搜索、多选分类筛选、排序和分页。

默认只返回 `status = published` 且 `visibility = public` 的 Skill。

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `query` | `string` | 否 | 按名称、短描述、标签模糊搜索 |
| `category` | `string` | 否 | 能力类型，多值用逗号分隔，例如 `nlp/classification,code/script` |
| `subCategory` | `string` | 否 | 业务场景，多值用逗号分隔，例如 `customer-service,operations` |
| `sort` | `string` | 否 | 排序方式：`hot`（默认）、`newest`、`mostUsed` |
| `limit` | `number` | 否 | 返回数量，默认 20 |
| `offset` | `number` | 否 | 偏移量，默认 0 |

### 响应

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "342562029564854272",
        "skillId": "email-classifier",
        "name": "邮件意图分类",
        "shortDescription": "自动识别邮件意图",
        "description": "自动识别邮件意图：咨询、投诉、售后、合作",
        "author": "fde-team",
        "category": "nlp/classification",
        "subCategory": "customer-service",
        "tags": ["email", "classification"],
        "iconUrl": "https://example.com/icon.png",
        "runtimeType": "llm_prompt",
        "visibility": "public",
        "status": "published",
        "latestVersion": "2.1.0",
        "downloadCount": 128,
        "createdAt": "2026-08-01T09:00:00.000Z",
        "updatedAt": "2026-08-01T09:30:00.000Z"
      }
    ],
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## POST /api/skills

创建一个新的 Skill。

### 请求头

```
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `skillId` | `string` | 是 | Skill 业务唯一标识，全局唯一 |
| `name` | `string` | 是 | 显示名称 |
| `shortDescription` | `string` | 否 | 一句话描述 |
| `description` | `string` | 否 | 详细功能描述 |
| `author` | `string` | 否 | 作者/团队 |
| `category` | `string` | 否 | 技术能力分类，例如 `nlp/classification` |
| `subCategory` | `string` | 否 | 业务场景分类，例如 `customer-service` |
| `tags` | `string[]` | 否 | 标签数组 |
| `iconUrl` | `string` | 否 | 图标 URL |
| `runtimeType` | `string` | 否 | 运行方式：`llm_prompt`、`python_script`、`api_call`、`workflow` |
| `visibility` | `string` | 否 | 可见性：`public`、`private`、`team` |
| `status` | `string` | 否 | 状态：`draft`、`pending_review`、`published`、`deprecated`，默认 `draft` |

### 请求示例

```json
{
  "skillId": "email-classifier",
  "name": "邮件意图分类",
  "shortDescription": "自动识别邮件意图",
  "description": "自动识别邮件意图：咨询、投诉、售后、合作",
  "author": "fde-team",
  "category": "nlp/classification",
  "subCategory": "customer-service",
  "tags": ["email", "classification"],
  "runtimeType": "llm_prompt",
  "visibility": "public",
  "status": "draft"
}
```

### 响应

```json
{
  "success": true,
  "data": {
    "id": "342562029564854272",
    "skillId": "email-classifier",
    "name": "邮件意图分类",
    "shortDescription": "自动识别邮件意图",
    "description": "自动识别邮件意图：咨询、投诉、售后、合作",
    "author": "fde-team",
    "category": "nlp/classification",
    "subCategory": "customer-service",
    "tags": ["email", "classification"],
    "iconUrl": null,
    "runtimeType": "llm_prompt",
    "visibility": "public",
    "status": "draft",
    "latestVersion": null,
    "createdAt": "2026-08-01T09:00:00.000Z",
    "updatedAt": "2026-08-01T09:00:00.000Z"
  }
}
```

### 错误响应

```json
{
  "success": false,
  "data": null,
  "message": "Skill with skillId \"email-classifier\" already exists"
}
```

## POST /api/skills/create-with-version

创建 Skill 并同时创建第一个版本（在线编辑场景），支持同时上传附件文件。

支持两种请求方式：

- `application/json`：只传元数据
- `multipart/form-data`：同时传元数据和文件

### application/json 模式

请求头：

```
Content-Type: application/json
```

请求体：

```json
{
  "skill": { /* Skill 元信息 */ },
  "version": { /* 版本信息 */ }
}
```

### multipart/form-data 模式

请求头：

```
Content-Type: multipart/form-data
```

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `data` | `string` (JSON) | 是 | `{ skill, version }` 元数据 |
| `file` | `File` (multiple) | 否 | 附件文件，可传多个 |

### 请求示例

```bash
curl -X POST http://localhost:3000/api/skills/create-with-version \
  -F 'data={"skill":{"skillId":"email-classifier","name":"邮件意图分类","runtimeType":"llm_prompt","visibility":"public"},"version":{"version":"1.0.0","runtimeConfig":{"model":"gpt-4o","temperature":0.2}}}' \
  -F 'file=@prompt.txt' \
  -F 'file=@icon.png'
```

### 响应

```json
{
  "success": true,
  "data": {
    "skill": { /* 创建的 Skill */ },
    "version": { /* 创建的版本 */ },
    "assets": [
      { "type": "prompt", "path": "skills/email-classifier/1.0.0/prompt.txt", "size": 123 }
    ]
  }
}
```

---

## GET /api/skills/:id

获取指定 Skill 详情。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |

### 响应

```json
{
  "success": true,
  "data": {
    "id": "342562029564854272",
    "skillId": "email-classifier",
    "name": "邮件意图分类",
    "shortDescription": "自动识别邮件意图",
    "description": "自动识别邮件意图：咨询、投诉、售后、合作",
    "author": "fde-team",
    "category": "nlp/classification",
    "subCategory": "customer-service",
    "tags": ["email", "classification"],
    "iconUrl": "https://example.com/icon.png",
    "runtimeType": "llm_prompt",
    "visibility": "public",
    "status": "published",
    "latestVersion": "2.1.0",
    "createdAt": "2026-08-01T09:00:00.000Z",
    "updatedAt": "2026-08-01T09:30:00.000Z"
  }
}
```

### 错误响应

```json
{
  "success": false,
  "data": null,
  "message": "Skill not found"
}
```

---

## PATCH /api/skills/:id

更新 Skill 元数据。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |

### 请求头

```
Content-Type: application/json
```

### 请求体

与 `POST /api/skills` 相同，但 `skillId` 不可修改。所有字段可选。

### 请求示例

```json
{
  "name": "邮件意图分类 v2",
  "description": "更新后的描述",
  "category": "nlp/classification"
}
```

### 响应

```json
{
  "success": true,
  "data": { /* 更新后的 Skill */ }
}
```

---

## DELETE /api/skills/:id

删除指定 Skill。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |

### 响应

```json
{
  "success": true,
  "data": null
}
```

---

## GET /api/skills/:id/versions

获取某 Skill 的所有版本。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |

### 响应

```json
{
  "success": true,
  "data": [
    {
      "id": "342562029564854273",
      "skillId": "342562029564854272",
      "version": "2.1.0",
      "runtimeConfig": { "model": "gpt-4o", "temperature": 0.2 },
      "inputSchema": [{ "name": "email_content", "type": "string", "required": true }],
      "outputSchema": [{ "name": "intent", "type": "enum" }],
      "dependencies": [],
      "permissions": ["read:email_content"],
      "evaluation": { "accuracy": ">=0.85" },
      "assetRefs": [{ "type": "prompt", "path": "skills/email-classifier/2.1.0/prompt.txt" }],
      "status": "stable",
      "isLatest": true,
      "publishedAt": "2026-08-01T09:30:00.000Z",
      "createdAt": "2026-08-01T09:30:00.000Z"
    }
  ]
}
```

---

## GET /api/skills/:id/versions/:version

获取指定版本详情。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |
| `version` | `string` | 版本号，如 `2.1.0` |

### 响应

```json
{
  "success": true,
  "data": {
    "id": "342562029564854273",
    "skillId": "342562029564854272",
    "version": "2.1.0",
    "semverMajor": 2,
    "semverMinor": 1,
    "semverPatch": 0,
    "runtimeConfig": { "model": "gpt-4o", "temperature": 0.2 },
    "inputSchema": [{ "name": "email_content", "type": "string", "required": true }],
    "outputSchema": [{ "name": "intent", "type": "enum" }],
    "dependencies": [],
    "permissions": ["read:email_content"],
    "evaluation": { "accuracy": ">=0.85" },
    "assetRefs": [{ "type": "prompt", "path": "skills/email-classifier/2.1.0/prompt.txt" }],
    "status": "stable",
    "isLatest": true,
    "publishedAt": "2026-08-01T09:30:00.000Z",
    "createdAt": "2026-08-01T09:30:00.000Z"
  }
}
```

---

## POST /api/skills/:id/versions

为指定 Skill 发布新版本。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |

### 请求头

```
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `version` | `string` | 是 | 版本号，如 `2.1.0` |
| `runtimeConfig` | `object` | 否 | 运行时配置 |
| `inputSchema` | `array` | 否 | 输入 schema |
| `outputSchema` | `array` | 否 | 输出 schema |
| `dependencies` | `array` | 否 | 依赖列表 |
| `permissions` | `string[]` | 否 | 所需权限 |
| `evaluation` | `object` | 否 | 评测标准 |
| `assetRefs` | `array` | 否 | 资源引用列表 |
| `status` | `string` | 否 | 状态：`draft`、`beta`、`stable`、`deprecated`，默认 `draft` |

### 请求示例

```json
{
  "version": "2.1.0",
  "runtimeConfig": {
    "model": "gpt-4o",
    "temperature": 0.2,
    "resource": "prompt_v2.1.txt"
  },
  "inputSchema": [
    { "name": "email_content", "type": "string", "required": true }
  ],
  "outputSchema": [
    { "name": "intent", "type": "enum", "values": ["inquiry", "complaint"] },
    { "name": "confidence", "type": "number" }
  ],
  "dependencies": [
    { "skill": "text-cleaner", "version": "^1.0.0" }
  ],
  "permissions": ["read:email_content", "call:external_api"],
  "evaluation": { "accuracy": ">=0.85", "latency": "<=2s" },
  "assetRefs": [
    { "type": "prompt", "path": "skills/email-classifier/2.1.0/prompt_v2.1.txt" }
  ],
  "status": "draft"
}
```

### 响应

```json
{
  "success": true,
  "data": { /* 创建的版本 */ }
}
```

---

## POST /api/skills/:id/versions/:version/publish

发布版本，将其状态设为 `stable`，并更新 `latest` 指针。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |
| `version` | `string` | 版本号 |

### 响应

```json
{
  "success": true,
  "data": {
    "id": "342562029564854273",
    "skillId": "342562029564854272",
    "version": "2.1.0",
    "status": "stable",
    "isLatest": true,
    "publishedAt": "2026-08-01T09:30:00.000Z"
  }
}
```

---

## POST /api/skills/:id/versions/:version/tags

设置版本标签。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |
| `version` | `string` | 版本号 |

### 请求头

```
Content-Type: application/json
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `tag` | `string` | 是 | `latest`、`stable`、`beta` |

### 请求示例

```json
{
  "tag": "latest"
}
```

### 响应

```json
{
  "success": true,
  "data": { /* 更新后的版本 */ }
}
```

---

## 文件存储模式

后端支持两种文件存储模式，通过环境变量 `STORAGE_TYPE` 切换：

| 模式 | 环境变量 | 说明 |
|---|---|---|
| `local` | 默认 | 文件保存在本地磁盘，路径为 `{STORAGE_DIR}/skills/{skillId}/{version}/{filename}` |
| `s3` | `STORAGE_TYPE=s3` | 文件上传到 S3 兼容对象存储 |

### local 模式（默认）

```bash
# 默认保存路径
./data/storage/skills/{skillId}/{version}/{filename}
```

可通过 `STORAGE_DIR` 自定义根目录：

```bash
STORAGE_DIR=/custom/path
```

### s3 模式

```bash
STORAGE_TYPE=s3
S3_ENDPOINT=https://s3.example.com
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=skill-platform
```

---

## 前端调用示例

```ts
import { listSkills, getSkill, createSkill } from "@/services/skills"

// 获取列表
const skills = await listSkills({ query: "邮件", limit: 10 })

// 获取详情
const skill = await getSkill("342562029564854272")

// 创建 Skill
const newSkill = await createSkill({
  skillId: "email-classifier",
  name: "邮件意图分类",
  runtimeType: "llm_prompt",
})
```
