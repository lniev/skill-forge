# CLAUDE.md

> 本文件用于向 Claude Code 说明项目结构、开发规范和约定。修改前请同步更新。

## 项目简介

**SkillForge** 是一个通用 AI Skill 管理平台，支持 Skill 的发布、安装、运行、评估与资产管理。

- **Monorepo**：pnpm workspaces + Turbo
- **桌面端**：Tauri 2 + Vite + React + TypeScript
- **后端**：Hono + TypeScript + Node.js
- **共享包**：`api` / `ui` / `shared` / `config`

## 目录结构

```
skill-platform/
├── apps/
│   ├── desktop/              # Tauri + React + TypeScript 桌面应用
│   │   ├── src/              # 前端源码
│   │   └── src-tauri/        # Rust 主进程
│   └── server/               # HonoJS 后端服务
├── packages/
│   ├── api/                  # 前后端共享的 API 类型与契约
│   ├── ui/                   # 共享 React UI 组件
│   ├── shared/               # 公共工具函数、常量
│   └── config/               # 共享工程化配置
├── docs/                     # 设计文档
├── examples/                 # 示例 Skill
├── scripts/                  # 构建/发布脚本
└── tests/                    # 集成/端到端测试
```

## 常用命令

```bash
# 安装依赖
pnpm install

# 启动桌面端（Vite + Tauri）
pnpm dev:desktop

# 启动后端服务
pnpm dev:server

# 构建所有包
pnpm build

# 构建桌面端（Vite 产物）
pnpm build:desktop

# 构建桌面端 Tauri 安装包
pnpm build:desktop:tauri

# 构建后端服务
pnpm build:server

# 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 单独启动桌面端
pnpm --filter @skill-platform/desktop dev

# 单独启动后端
pnpm --filter @skill-platform/server dev
```

## 技术栈

- **包管理器**：pnpm 9.x
- **构建工具**：Vite 5.x
- **前端框架**：React 18.x + TypeScript 5.x
- **桌面端框架**：Tauri 2.x
- **后端框架**：Hono
- **状态管理**：Zustand（桌面端 Header 状态）
- **样式**：Tailwind CSS 3.4
- **路由**：react-router-dom 7.x
- **UI 组件库**：shadcn/ui 组件，集成在 `packages/ui` 中
- **图标**：SVG sprite（`public/icons/sprite.svg`）

## UI 组件规范

UI 组件位于 `packages/ui/src/components/<ComponentName>/`，必须采用文件夹形式组织：

```
packages/ui/src/components/<ComponentName>/
├── index.ts              # barrel 导出
├── <ComponentName>.tsx   # 主组件
├── types.ts              # 类型定义
└── <ComponentName>*.tsx  # 子组件（如需要）
```

### 命名规则

- 文件夹：`PascalCase`
- 主组件文件：`<ComponentName>.tsx`
- 子组件文件：`<ComponentName>Sub.tsx`
- 类型文件：`types.ts`
- barrel 文件：`index.ts`

### 导出规则

- barrel 文件必须包含命名导出：

```ts
export { Component } from "./Component"
export type { ComponentProps } from "./types"
```

- 主组件可额外提供默认导出：`export default Component`

### 入口更新

创建组件后，必须在 `packages/ui/src/index.tsx` 中添加导出：

```ts
export { Component } from "./components/Component"
export type { ComponentProps } from "./components/Component"
```

### shadcn/ui 组件集成

使用 `pnpm dlx shadcn@latest add <component>` 安装后，将组件文件整理到 `packages/ui/src/components/<ComponentName>/` 目录下，并按项目规范添加 barrel 导出。

## 页面规范

桌面端页面位于 `apps/desktop/src/pages/<PageName>/`，必须采用文件夹形式组织：

```
apps/desktop/src/pages/<PageName>/
├── index.ts              # barrel 导出
└── <PageName>.tsx        # 页面组件
```

### 命名规则

- 文件夹名：`PascalCase`，与页面组件同名
- 主文件：`<PageName>.tsx`
- barrel 文件：`index.ts`

### 导出规则

- barrel 文件：`export { PageName } from "./PageName"`
- 页面组件默认导出：`export default function PageName() {}`

### 路由引用

路由文件从文件夹导入：

```ts
import { Dashboard } from "../pages/Dashboard"
import { Registry } from "../pages/Registry"
```

## 状态管理

桌面端使用 **Zustand** 管理部分全局状态。

- **Header 状态**：`apps/desktop/src/store/headerStore.ts`
  - 管理顶部 Header 的 `left` / `center` / `right` 插槽内容
  - 使用 `useHeaderActions()` 设置插槽
  - 使用 `useHeaderStore()` 读取状态
  - `LayoutHeader` 会在页面切换时自动重置为默认标题

## 国际化（i18n）

桌面端已实现基于 **i18next + react-i18next** 的国际化，支持英文（`en`）和中文（`zh`）。

- 资源文件：`packages/shared/src/i18n/locales/<lang>/common.ts`
- 初始化：`apps/desktop/src/i18n.ts` 中引入 `@skill-platform/shared/i18n`
- 使用方式：在 React 组件中使用 `useTranslation()`，通过 `t("key")` 获取文案
- 语言持久化：`useSettingsStore` 中的 `language` 会保存到 Tauri Store，并在 `SettingsInitializer` 中应用
- 新增文案时，同步在 `common.ts` 的 `zh` 和 `en` 中添加对应 key，运行 `pnpm typecheck` 验证类型

## 设计系统

采用 **Apple 风格**设计系统：

- 颜色：使用 CSS 变量定义在 `packages/ui/src/globals.css`
- 圆角：大圆角风格
- 背景：玻璃态效果（`backdrop-blur`、`bg-card/80`）
- 字体：系统默认无衬线字体
- 主题变量：`-background`、`-foreground`、`-primary`、`-secondary`、`-border` 等

## 路由

路由定义在 `apps/desktop/src/routes/index.tsx`：

```ts
export const routePaths = {
  dashboard: "/",
  registry: "/registry",
  runtime: "/runtime",
  evaluation: "/evaluation",
  skillDetail: "/skill/:id",
} as const
```

- 所有页面共用 `Layout` 作为外层布局
- `Layout` 包含 `Sidebar` 和 `LayoutHeader`
- 页面详情路由：`/skill/:id`

## Claude Code Skill

项目规范通过 `.claude/skills/` 下的 Skill 文件约束：

- `create-ui-component`：创建 UI 组件时遵循
- `create-page`：创建页面时遵循
- `create-project-element`：总入口，分发到子 skill

新增 Skill 时，按现有格式编写 `SKILL.md`，并在 `.claude/skills/` 下创建对应目录。

## 注意事项

- 修改 `packages/ui` 组件后，需要检查 `packages/ui/src/index.tsx` 的导出是否完整
- 路由页面 folder 化后，导入路径必须指向文件夹，而不是具体文件
- 桌面端 `Header` 组件封装在 `apps/desktop/src/components/Header/`，原 `packages/ui` 下的 `Header` 保持不动
- 运行 `pnpm typecheck` 验证类型变更

## 参考资源

- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Tauri 文档](https://tauri.app/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
