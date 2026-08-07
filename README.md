# SkillForge

通用 AI Skill 管理平台，支持 Skill 的发布、安装、运行、评估与资产管理。

## 技术栈

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

# 单独启动后端
pnpm --filter @skill-platform/server dev

# 单独启动桌面端
pnpm --filter @skill-platform/desktop dev
```

## 最小可行方案（MVP）

1. 定义 Skill 标准格式（JSON/YAML）
2. 搭建 Skill 仓库（列表、上传、版本、分类）
3. 实现安装器（API 拉取 + 参数注入）
4. 埋点监控（调用输入、输出、耗时、反馈）
5. 跑通一个业务闭环（示例：邮件意图分类）
