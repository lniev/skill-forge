# Skill 列表接口改进需求文档

> 适用页面：`apps/desktop/src/pages/Skills/Skills.tsx`  
> 关联接口：`GET /api/skills`  
> 文档目的：汇总当前列表页对接 `GET /api/skills` 时发现的数据与能力缺口，供后端同学参考改造。

---

## 1. 当前接口契约

### 请求参数

```ts
interface ListSkillsQuery {
  query?: string          // 搜索关键字
  category?: string       // 能力类型（单值）
  subCategory?: string    // 业务场景（单值）
  limit?: number
  offset?: number
}
```

### 当前响应

```ts
type ListSkillsResponse = ApiResponse<Skill[]>
```

```ts
interface Skill {
  id: string
  skillId: string
  name: string
  shortDescription?: string
  description?: string
  author?: string
  category?: string
  subCategory?: string
  tags?: string[]
  iconUrl?: string
  runtimeType?: RuntimeType
  visibility?: Visibility
  status: SkillStatus
  latestVersion?: string
  createdAt: Date
  updatedAt: Date
}
```

---

## 2. 当前实现已做但后端未完全支撑的能力

### 2.1 排序：按热度 / 最新上架 / 最多使用

当前列表页 UI 已提供三种排序：

- `hot`：按热度
- `newest`：最新上架
- `mostUsed`：最多使用

**当前问题**：后端接口没有 `sort` 参数，也没有返回热度、使用次数等排序指标，导致 `hot` 和 `mostUsed` 在前端只能做兜底（目前不做任何排序）。

**建议改造**：

1. 新增请求参数 `sort`，取值：
   - `newest`：按 `createdAt` / `publishedAt` 倒序
   - `hot`：按综合热度分倒序（可基于下载量、收藏量、近期调用量加权）
   - `mostUsed`：按累计调用/使用次数倒序
2. 在 `Skill` 模型或列表响应中返回相关统计字段，例如：
   - `downloadCount: number`
   - `usageCount: number`
   - `hotScore: number`
   - `rating?: number` （评分，可选）

---

### 2.2 多选筛选：能力类型 / 业务场景

当前列表页已支持多选标签组合筛选：

- 能力类型：NLP/分类、信息提取、文本生成、代码脚本、数据处理、工作流、视觉/图像、语音/音频等
- 业务场景：客服、运营、供应链、销售、市场、人力资源、财务、法务、IT/研发等

**当前问题**：`category` 和 `subCategory` 请求参数仅支持单值字符串，前端需要把多选逻辑放在客户端执行，无法利用后端分页和搜索性能。

**建议改造**：

1. 支持数组传参，例如：
   - `category=nlp%2Fclassification,code%2Fscript,vision`
   - `subCategory=customer-service,operations`
2. 或者改为逗号分隔的多值字符串，后端解析为 `IN (...)` 查询。

---

### 2.3 分页信息缺失

**当前问题**：接口直接返回 `Skill[]`，前端无法拿到总数量 `total`，导致分页组件只能根据当前返回数据量估算总页数。

**建议改造**：

列表接口返回分页结构：

```ts
interface ListSkillsResponse {
  success: boolean
  data: {
    items: Skill[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
```

前端会同步调整 `useSkills` / `listSkills` 的消费方式。

---

### 2.4 搜索字段与范围

**当前问题**：

- 前端搜索框目前只在本地搜索，没有真正调用接口，因为不确定后端搜索是否稳定/符合预期。
- 后端当前搜索范围是 `name`、`skillId`、`description`（含 `description` 可能性能较差且命中不准）。

**建议改造**：

1. 确认并优化搜索策略：
   - 默认对 `name`、`shortDescription`、`tags` 做模糊匹配。
   - 如需要全文搜索 `description`，建议额外建全文索引或改用专用搜索服务。
2. 返回高亮字段（可选）：`highlightedName`、`highlightedShortDescription`，便于前端标红关键词。
3. 支持拼音/大小写不敏感（可选）。

---

### 2.5 列表卡片展示字段缺口

当前列表卡片展示的信息包括：图标、名称、短描述、分类标签、版本号、下载数、收藏数、安装按钮。

#### 2.5.1 下载数 / 使用数 / 评分

**当前问题**：`Skill` 模型没有这些统计字段，卡片上只能显示 `--`。

**建议改造**：

在 `Skill` 列表项中返回：

```ts
interface SkillListItem extends Skill {
  downloadCount: number   // 累计下载/安装次数
  usageCount: number      // 累计调用次数
  rating?: number         // 平均评分，0-5
  reviewCount?: number    // 评分人数
}
```

#### 2.5.2 作者信息

**当前问题**：只有 `author?: string` 一个字段，如果展示头像、作者名不够用。

**建议改造**：

```ts
interface SkillListItem extends Skill {
  author?: {
    name: string
    avatarUrl?: string
    userId?: string
  }
}
```

如果暂时只有字符串，保持 `author` 字符串也可以，但建议后续扩展。

#### 2.5.3 图标占位

**当前问题**：`iconUrl` 是可选的，很多 Skill 没有图标，前端只能显示 emoji 占位。

**建议改造**：

- 后端在上传/发布时生成默认 `iconUrl`（基于首字母或 category 的默认图）。
- 或返回 `placeholderIcon?: { color: string; text: string }`。

---

### 2.6 列表默认过滤：只展示已上架/公开 Skill

**当前问题**：接口没有根据 `status` / `visibility` 过滤，可能把草稿、私有 Skill 也返回给市场列表。

**建议改造**：

1. 列表接口默认只返回：
   - `status = "published"`
   - `visibility = "public"`
2. 管理员/作者本人需要看全部时，通过额外参数（如 `?includeDrafts=true` 或单独的管理接口）控制，不要影响市场列表。

---

### 2.7 分类/标签元数据最好由后端维护

**当前问题**：分类选项 `TECH_CATEGORIES` 和 `BUSINESS_CATEGORIES` 目前写死在前端 `apps/desktop/src/config/categories.ts` 中，新增/修改分类需要改前端代码。

**建议改造**：

新增一个分类元数据接口：

```ts
GET /api/skills/categories
```

返回：

```ts
{
  tech: { id: string; label: string }[]
  business: { id: string; label: string }[]
}
```

这样前端可以动态渲染筛选标签，后端统一管理分类字典。

---

## 3. 建议的接口升级方案

### 3.1 请求参数

```ts
interface ListSkillsQuery {
  query?: string
  /** 能力类型，多值用逗号分隔 */
  category?: string
  /** 业务场景，多值用逗号分隔 */
  subCategory?: string
  /** 标签，多值用逗号分隔（可选） */
  tags?: string
  /** 排序方式 */
  sort?: "hot" | "newest" | "mostUsed"
  limit?: number
  offset?: number
}
```

### 3.2 响应结构

```ts
interface SkillListItem extends Skill {
  downloadCount: number
  usageCount: number
  rating?: number
  reviewCount?: number
}

interface PaginatedListSkillsResponse {
  success: boolean
  data: {
    items: SkillListItem[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
```

---

## 4. 优先级建议

| 优先级 | 改造点 |
| --- | --- |
| P0 | 分页信息（`total` / `hasMore`） |
| P0 | 默认过滤 `status = published`、`visibility = public` |
| P0 | `sort` 参数与 `newest` 排序 |
| P1 | 返回 `downloadCount` / `usageCount` |
| P1 | 多选筛选（`category` / `subCategory` 支持数组） |
| P1 | 搜索真正走接口 |
| P2 | 返回 `rating`、`reviewCount` |
| P2 | 默认 icon / 作者信息扩展 |
| P2 | 分类元数据接口 `/api/skills/categories` |
| P3 | 搜索结果高亮 |

---

## 5. 前端配合事项

- 后端返回分页结构后，前端将同步调整 `services/skills/index.ts` 的 `listSkills` 和 `useSkills`。
- 排序 `hot` / `mostUsed` 接入真实字段后，前端会替换当前的本地兜底逻辑。
- 多选筛选接入后端后，前端会取消本地过滤，改为把数组拼成逗号分隔字符串传给后端。
- 分类元数据接口 ready 后，前端会移除硬编码的 `TECH_CATEGORIES` / `BUSINESS_CATEGORIES`，改为接口获取。
