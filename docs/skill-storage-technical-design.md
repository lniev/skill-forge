# 后端 Skill 存储技术方案

基于 `docs/product-spec.md` 中 Skill 管理平台的需求，结合本项目 **Hono + TypeScript + Node.js** 后端栈，给出后端 Skill 存储的完整技术方案。

---

## 一、设计目标

| 目标 | 说明 |
|---|---|
| 结构化存储 | 保存 Skill 元数据、版本、依赖、权限、评测配置等 |
| 文件资源托管 | 存储 Skill 运行所需的提示词、脚本、图标等二进制/文本资源 |
| 版本控制 | 支持多版本共存、`latest/stable/beta` 标签、向后兼容升级 |
| 高效检索 | 按名称/分类/标签/使用次数/评分搜索与发现 |
| 运行时解耦 | Skill 定义与运行资源分离，运行时按需拉取 |
| 可扩展性 | 预留多租户、权限审批、评测数据回流等扩展点 |

---

## 二、整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                        API 层 (Hono)                         │
│  skills  │  versions  │  assets  │  installs  │  evaluations │
└──────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  ┌──────────┐       ┌──────────┐        ┌──────────┐
  │  关系型 DB │       │ 对象存储  │        │  缓存    │
  │ (PostgreSQL│       │  (本地/MinIO/ │        │ (Redis) │
  │ /SQLite)  │       │    S3)       │        │         │
  └──────────┘       └──────────┘        └──────────┘
```

---

## 三、存储拆分策略

### 3.1 元数据：关系型数据库

Skill 的核心结构适合用关系型数据库存储，保证查询、关联、事务能力。

推荐表结构（PostgreSQL / SQLite）：

#### `skills` — Skill 主表

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | UUID / VARCHAR | 主键，Skill 唯一标识 |
| `skill_id` | VARCHAR | 业务 ID，如 `email-classifier` |
| `name` | VARCHAR | 显示名称 |
| `description` | TEXT | 功能描述 |
| `author` | VARCHAR | 作者/团队 |
| `category` | VARCHAR | 分类，如 `nlp/classification` |
| `tags` | JSONB / TEXT | 标签数组 |
| `icon_url` | VARCHAR | 图标地址 |
| `runtime_type` | ENUM | `llm_prompt` / `python_script` / `api_call` / `workflow` |
| `status` | ENUM | `draft` / `pending_review` / `published` / `deprecated` |
| `latest_version` | VARCHAR | 最新版本号，冗余加速查询 |
| `created_at` | TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | 更新时间 |

#### `skill_versions` — 版本表

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | UUID | 主键 |
| `skill_id` | UUID FK | 关联 skills |
| `version` | VARCHAR | 版本号，如 `2.1.0` |
| `runtime_config` | JSONB | runtime 配置对象 |
| `input_schema` | JSONB | 输入 schema |
| `output_schema` | JSONB | 输出 schema |
| `dependencies` | JSONB | 依赖其他 Skill 列表 |
| `permissions` | JSONB | 所需权限列表 |
| `evaluation` | JSONB | 评测标准 |
| `asset_refs` | JSONB | 资源引用列表 |
| `status` | ENUM | `draft` / `beta` / `stable` / `deprecated` |
| `is_latest` | BOOLEAN | 是否 latest 版本 |
| `published_at` | TIMESTAMP | 发布时间 |
| `created_at` | TIMESTAMP | 创建时间 |

#### `skill_categories` / `skill_tags` — 分类与标签

- 预定义 `categories` 表：客服、运营、供应链、NLP、生成、提取等。
- `tags` 表支持动态标签，多对多关联 Skill。

#### `skill_installs` — 安装记录

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | UUID | 主键 |
| `skill_id` | UUID FK | 关联 Skill |
| `version` | VARCHAR | 安装版本 |
| `target_app_id` | VARCHAR | 宿主 AI 工具 ID |
| `target_env` | ENUM | `dev` / `staging` / `prod` |
| `custom_config` | JSONB | 业务方自定义配置 |
| `permissions` | JSONB | 已授权权限 |
| `status` | ENUM | `applying` / `approved` / `rejected` / `installed` / `uninstalled` |
| `installed_at` | TIMESTAMP | 安装时间 |

### 3.2 文件资源：对象存储

Skill 的运行资源（prompt 模板、脚本、图标、评测数据集）统一存到对象存储。

#### 存储路径规范

```
skills/
  {skill_id}/
    versions/
      {version}/
        prompt_v2.1.txt
        script.py
        icon.png
        eval_dataset.jsonl
    latest/           # 软链接或元数据指向
      prompt.txt
```

#### 存储后端选择

| 场景 | 方案 |
|---|---|
| 本地开发 | 本地文件系统（`apps/server/storage/`） |
| 测试/小规模 | MinIO 兼容 S3 API |
| 生产 | AWS S3 / 阿里云 OSS / Cloudflare R2 |

#### 元数据中资源引用格式

```json
{
  "asset_refs": [
    { "type": "prompt", "path": "skills/email-classifier/v2.1.0/prompt_v2.1.txt" },
    { "type": "icon", "path": "skills/email-classifier/v2.1.0/icon.png" },
    { "type": "eval_dataset", "path": "skills/email-classifier/v2.1.0/eval.jsonl" }
  ]
}
```

### 3.3 缓存：Redis

- **热点 Skill 元数据**：缓存 `skill_id + version -> 完整配置`
- **latest 版本映射**：缓存 `skill_id -> latest version`
- **搜索索引辅助**：热门搜索词结果缓存
- TTL：根据更新频率设置 5~30 分钟

---

## 四、核心 API 设计（Hono）

### 4.1 Skill 仓库接口

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/skills` | 列表 + 搜索 + 筛选 |
| `POST` | `/api/skills` | 创建 Skill（草稿） |
| `GET` | `/api/skills/:id` | Skill 详情 |
| `PATCH` | `/api/skills/:id` | 更新元数据 |
| `DELETE` | `/api/skills/:id` | 下架/删除 Skill |
| `GET` | `/api/skills/:id/versions` | 获取所有版本 |
| `GET` | `/api/skills/:id/versions/:version` | 获取指定版本 |
| `POST` | `/api/skills/:id/versions` | 发布新版本 |
| `POST` | `/api/skills/:id/versions/:version/publish` | 审核通过并发布 |
| `POST` | `/api/skills/:id/versions/:version/tags` | 设置标签 `latest`/`stable`/`beta` |

### 4.2 资源文件接口

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/skills/:id/versions/:version/assets` | 上传资源文件 |
| `GET` | `/api/skills/:id/versions/:version/assets/:name` | 下载/查看资源 |
| `DELETE` | `/api/skills/:id/versions/:version/assets/:name` | 删除资源 |

### 4.3 安装管理接口

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/skills/:id/install` | 申请安装 |
| `GET` | `/api/installs` | 安装列表 |
| `POST` | `/api/installs/:installId/approve` | 审批通过 |
| `POST` | `/api/installs/:installId/reject` | 审批拒绝 |
| `GET` | `/api/installs/:installId/config` | 获取安装配置（运行时拉取） |

### 4.4 运行时与评估接口

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/skills/:id/invoke` | 同步调用 Skill |
| `POST` | `/api/skills/:id/invoke-async` | 异步调用 |
| `GET` | `/api/skills/:id/metrics` | 调用指标（延迟、准确率、成本） |
| `POST` | `/api/skills/:id/evaluations` | 提交评测结果 |
| `GET` | `/api/skills/:id/evaluations` | 评测记录 |

---

## 五、版本策略

### 5.1 版本号规范

采用 **SemVer**：`MAJOR.MINOR.PATCH`

| 变更类型 | 版本号变化 | 升级策略 |
|---|---|---|
| 补丁修复 | PATCH + 1 | 自动热更新 |
| 新增功能（兼容） | MINOR + 1 | 自动热更新 |
| 破坏性变更 | MAJOR + 1 | 需人工确认 |

### 5.2 标签机制

- `latest`：最新发布版本
- `stable`：经过验证的稳定版本
- `beta`：灰度/测试版本

```sql
UPDATE skill_versions
SET is_latest = true
WHERE skill_id = ? AND version = ?;
```

### 5.3 升级/回滚流程

```
检测到新版本
   │
   
Major 版本变更？ ──是──→ 人工确认升级
   │否
   ▼
自动推送 Minor/Patch 版本
   │
   ▼
运行时加载新版配置
   │
   
效果下降？ ──是──→ 一键回滚到 stable 标签版本
```

---

## 六、Skill 运行时加载流程

```
1. 宿主 AI 工具启动 / 收到调用请求
         │
         ▼
2. 查询 skill_id + 目标版本（或 latest）
         │
         ▼
3. 从 DB 读取 skill_versions 中 runtime_config/input_schema/output_schema
         │
         ▼
4. 根据 asset_refs 从对象存储拉取 prompt/脚本等资源
         │
         ▼
5. 注入业务方自定义配置（模型、温度、阈值等）
         │
         ▼
6. 在沙箱环境中执行 Skill
         │
         ▼
7. 记录调用日志、指标、业务反馈 → 回流到仓库
```

---

## 七、关键表关系

```
skills (1) ────────< (N) skill_versions
   │                         │
   │                         │
   │                    asset_refs (JSONB)
   │                         │
   ▼                         ▼
skill_categories ──────>  对象存储 (S3/MinIO/本地)
   │
   │
skills (N) ────────< (M) installs
   │
   ▼
skill_tags (N:M)
```

---

## 八、技术选型与本项目契合点

| 组件 | 推荐方案 | 理由 |
|---|---|---|
| Web 框架 | Hono | 项目已有技术栈 |
| ORM | Drizzle ORM / Prisma | 类型安全，Schema 可迁移 |
| 数据库 | PostgreSQL | 支持 JSONB，适合半结构化配置 |
| 对象存储 | MinIO（开发）/ S3（生产） | S3 API 标准，易迁移 |
| 缓存 | Redis / 内存缓存 | 热点配置加速 |
| 搜索 | PostgreSQL 全文搜索 + 标签索引 | 满足 MVP，后期可接 Elasticsearch |
| 文件沙箱 | VM2 / Docker / QuickJS | 隔离 Skill 脚本执行 |

---

## 九、MVP 落地方案

1. **Schema 定义**：创建 `skills`、`skill_versions` 两张核心表
2. **文件存储**：本地对象存储实现 `POST/GET /assets`
3. **Skill CRUD**：实现发布、版本列表、详情查询
4. **latest 标签**：发布时自动更新 `latest` 指针
5. **运行时接口**：实现 `/invoke` + `/installs/:id/config` 供宿主拉取
6. **调用埋点**：记录每次调用的输入、输出、耗时、版本

---

## 十、扩展性考虑

- **多租户**：`skills` 表增加 `tenant_id` 字段
- **权限审批**：`skill_installs` 的 `status` 字段已预留审批流
- **依赖图谱**：新增 `skill_dependencies` 表记录依赖关系，支持递归查询
- **评测数据回流**：`skill_evaluations` 表关联 `skill_versions`
- **审计日志**：独立 `audit_logs` 表记录发布、安装、调用行为

---

## 十一、与本项目现有结构的集成建议

- 后端服务位于 `apps/server/`，可在 `src/routes/skills.ts` 中定义上述 Hono 路由。
- 数据库迁移文件建议放在 `apps/server/migrations/`。
- 对象存储的本地路径可配置为 `apps/server/storage/`。
- Skill 相关的共享类型可放入 `packages/api/src/skill.types.ts`，供前后端复用。
