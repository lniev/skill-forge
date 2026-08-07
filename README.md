# SkillForge

通用 AI Skill 管理平台，覆盖 Skill 的 **发布 → 仓库 → 安装 → 运行 → 评估** 全生命周期。

## 项目优势

- **全生命周期闭环**：从 Skill 上传发布、版本管理、分类检索，到安装到宿主 AI 工具、运行时调用、效果评估，一站式完成，无需拼装多个系统。
- **端到端类型安全**：`packages/api` 存放前后端共享的 Zod 契约（请求/响应 Schema、错误码），后端用 `@hono/zod-validator` 直接复用同一份 Schema 校验，前端复用同一份类型，改一处即全链路生效。
- **轻量可落地的技术选型**：
  - 后端 **Hono + Drizzle ORM + SQLite（better-sqlite3）**，单进程即可运行，零外部数据库依赖；
  - 桌面端 **Tauri 2（Rust）**，相比 Electron 体积更小、内存占用更低，且具备安全的本地文件系统能力。
- **完善的版本管理**：Skill 支持多版本并存、语义化版本自动递增、`latest` 指针切换、版本状态流转（草稿/发布/归档），资产按 `skillId/version` 隔离存储。
- **可插拔的对象存储**：`StorageProvider` 抽象了本地磁盘与 S3 兼容存储（MinIO）两种实现，`docker-compose.yml` 一键起 MinIO，开发/生产环境平滑切换。
- **本地 Skill 发现与链接**：Tauri Rust 侧实现了 Skill 的本地发现（discovery）、文件操作（fsops）、符号链接（link）与注册表（registry），可直接管理宿主机上各 AI 工具（如 Claude Code）已安装的 Skill。
- **内置认证与权限**：JWT（jose）+ 刷新令牌 + bcrypt 密码哈希，区分普通用户与管理员中间件，开箱即用。
- **国际化开箱即用**：基于 i18next 的中英文案，语言设置通过 Tauri Store 持久化。
- **工程化规范沉淀**：组件/页面均有文件夹组织规范与 barrel 导出约定，并配套 `.claude/skills/` 脚手架 Skill（`create-ui-component`、`create-page`），让 AI 辅助开发严格遵循项目约定。
- **Apple 风格设计系统**：基于 shadcn/ui + Tailwind 的统一设计变量，玻璃态卡片、大圆角，内置 20+ 规范封装的共享组件。

## 技术栈

- **Monorepo**：pnpm workspaces + Turbo
- **桌面端**：Tauri 2 + Vite + React 18 + TypeScript + Zustand + Tailwind CSS + shadcn/ui
- **后端**：Hono + Drizzle ORM + SQLite + jose（JWT）+ Zod
- **对象存储**：本地磁盘 / MinIO（S3 兼容）
- **共享包**：`api`（契约）/ `ui`（组件）/ `shared`（工具与 i18n）/ `config`

## 目录结构

```
skill-platform/
├── apps/
│   ├── desktop/              # Tauri + React + TypeScript 桌面应用
│   │   ├── src/              # 前端源码
│   │   └── src-tauri/        # Rust 主进程（本地 Skill 发现/链接/注册表）
│   └── server/               # HonoJS 后端服务（auth / skills / installs / invoke / assets / users）
├── packages/
│   ├── api/                  # 前后端共享的 API 类型与 Zod 契约
│   ├── ui/                   # 共享 React UI 组件
│   ├── shared/               # 公共工具函数、常量、i18n 资源
│   └── config/               # 共享工程化配置
├── docs/                     # 产品与技术设计文档
├── examples/                 # 示例 Skill
├── scripts/                  # 构建/发布脚本
├── tests/                    # 集成/端到端测试
└── docker-compose.yml        # MinIO 对象存储
```

## 核心概念

- **Skill**：可独立运行的 AI 能力单元，包含输入输出契约、运行时配置、依赖与权限。
- **Registry**：Skill 仓库，支持版本管理、分类、搜索与审核。
- **Installer**：将 Skill 安装到目标 AI 工具，完成参数配置与权限审批。
- **Runtime**：Skill 的执行环境，支持 Prompt 模板、代码脚本、工作流等多种类型。
- **Evaluation**：内置评测集与业务反馈，持续追踪 Skill 效果。

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动 MinIO 对象存储（可选，默认使用本地磁盘存储）
docker compose up -d

# 启动后端服务
pnpm dev:server

# 启动桌面端（Vite + Tauri）
pnpm dev:desktop
```

## 常用命令

```bash
# 构建所有包
pnpm build

# 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 数据库迁移（Drizzle）
pnpm --filter @skill-platform/server db:migrate

# 单独启动后端
pnpm --filter @skill-platform/server dev

# 单独启动桌面端
pnpm --filter @skill-platform/desktop dev
```

## 文档

产品与技术设计文档见 [`docs/`](./docs/)，包括产品方案、Skill 上传与存储技术设计、用户管理、分类体系等。接口契约见 `apps/server/src/routes/*/API.md`。

## License

MIT
