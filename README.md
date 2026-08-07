# <img src="./apps/desktop/src-tauri/icons/icon.png" alt="SkillForge" width="32" /> SkillForge

<p align="center">
  <strong>企业私有化 AI 技能管理平台</strong>
</p>

<p align="center">
  部署属于你自己的团队/公司技能市场，统一管理、分发和安装 AI 技能到 Claude Code、Codex、Cursor、Gemini CLI 等主流平台。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tauri-24c8d8?logo=tauri&logoColor=white" alt="Tauri" />
  <img src="https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Hono-ff6b6b?logo=hono&logoColor=white" alt="Hono" />
  <img src="https://img.shields.io/badge/Drizzle-C5C5C5?logo=drizzle&logoColor=black" alt="Drizzle" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-06b6d4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white" alt="shadcn/ui" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/pnpm-f69220?logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/Turbo-5a5a5a?logo=turborepo&logoColor=white" alt="Turbo" />
  <img src="https://img.shields.io/badge/SQLite-003b57?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Zod-3e67a8?logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/Node.js-5fa04e?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/Docker-2496ed?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/MinIO-c72e49?logo=minio&logoColor=white" alt="MinIO" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Claude%20Code-2563eb" alt="Claude Code" />
  <img src="https://img.shields.io/badge/Platform-Codex-2563eb" alt="Codex" />
  <img src="https://img.shields.io/badge/Platform-Gemini%20CLI-2563eb" alt="Gemini CLI" />
  <img src="https://img.shields.io/badge/Platform-Cursor-94a3b8" alt="Cursor" />
  <img src="https://img.shields.io/badge/Deploy-Private%20%F0%9F%94%92-16a34a" alt="Private Deploy" />
  <img src="https://img.shields.io/badge/License-MIT-64748b" alt="License" />
</p>

![SkillForge Preview](./preview.png)

---

## 📌 项目定位

**SkillForge** 是一个面向企业的**私有化 AI 技能管理平台**（Private AI Skill Marketplace）。

随着 Claude Code、Codex、Cursor 等 AI 编程助手成为开发工作流的核心，团队累了大量 Prompt 模板、工作流脚本和领域知识——但这些技能分散在文档、代码或个人笔记中，难以复用和版本管理。

### 核心痛点与解决方案

| 痛点 | SkillForge 方案 |
|------|----------------|
| 队技能分散，新人难以上手 | 统一技能市场，集中管理 |
| 技能质量参差不齐，无审核机制 | Draft / Stable 双轨发布 + 评估标准 |
| 外部技能源无法安全引入 | 私有市场 + 第三方仓库发现机制 |
| 多平台 IDE 技能不互通 | 一次定义，多平台安装 |

---

##  核心功能

### 1. 私有技能市场（Private Skill Market）

- 团队/公司部自托管的技能仓库
- 支持搜索、分类过滤（NLP/分类、信息提取、文本生成、代码本、工作流、视觉/图像等）
- 按热度排序，快速发现高频技能
- 技能本地导入，ai自动分析技能元数据，一键提交技能。

### 2. 技能全生命周期管理

- **版本管理**：Draft → Stable 轨发布流程
- **接口契约**：明确定义 Inputs / Outputs 参数（类型、必填、描述）
- **运行配置**：Model、Temperature 等运行时参数透明化
- **限控制**：细粒度权限声明（如 `read:chat`）
- **质量评估**：内置 Evaluation Criteria，定义技能质量预期

### 3. 多平台技能分发

技能可一键安装到主流 AI 开发平台：
Claude Code 、Codex 、 Gemini CLI 、Cursor 、Windsurf 、Roo / Trae

### 4. 第三方仓库技能源接入

- **GitHub Repos**：描并索引外部 GitHub 仓库中的技能
- **skills.sh**：支持脚本化安装源
- 可以自己安装公司私有的gitlab技能仓库，在设置中配置自动扫描仓库技能

---

## 🏗️ 架构概览

```text
┌─────────────────────────────────────────────────────────────┐
│                      SkillForge Server                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Skill Market │  │  Skill Detail │  │  Third-Party  │     │
│  │    技能市场    │  │    技能详情   │  │    Repos     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                                    │              │
│         ▼                                    ▼              │
│  ┌──────────────┐                  ┌──────────────┐          │
│  │  Versioning  │                  │  Repo Manager │        │
│  │ (Draft/Stable)│                  │(GitHub/.sh)  │        │
│  └──────────────┘                  └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌──────────────────────────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────
   │  Claude │          │  Codex  │          │  Gemini │
   │  Code   │          │   CLI   │          │   CLI   │
   └─────────┘          └─────────┘          └─────────┘
```

---

## 🚀 快速开始

### 环境要求

- Docker 20.10+
- Node.js 18+（如需源码部署）

### Docker 一键部署

```bash
# 克隆仓库
git clone https://github.com/your-org/skill-forge.git
cd skill-forge

# 启动服务
docker-compose up -d

```

打开app，登录页面点击左下角服务设置，输入api地址， http://localhost:3456/api
私有化部署后请输入私有ip地址或者域名

---

## 🧩 技能定义示例

每个技能由 `SKILL.md` 定义，包含完整的接口契约：

```yaml
id: skill-xiaohongshu-copy-001
name: xiaohongshu-copy
version: 1.0.0
runtime: llm_prompt
visibility: team
tags: [小红书, 文案生成, 社交媒体]

inputs:
  - name: theme_or_product
    type: string
    required: true
    description: 主题/产品类别（美妆/穿搭/旅行等）
  - name: core_selling_points
    type: string
    required: false
    description: 核心卖点

outputs:
  - name: title_suggestions
    type: string
    description: 封面/标题建议（3个备选）
  - name: body_text
    type: string
    description: 正文内容，300-800字

runtime_config:
  model: gpt-4o
  temperature: 0.7

permissions:
  - read:chat

evaluation_criteria:
  description: 文案是否符合小红书平台调性，语气是否亲切自然...
```

---

## 🔐 企业级特性

| 特性 | 说明 |
|------|------|
| **私有化部署** | 完全内网运行，数据不出域 |
| **多级可见性** | Private / Team / Organization 分级 |
| **发布审核** | Draft → Stable 需管理员审批 |
| **使用审计** | 技能调用日志与统计 |
| **Action 级管控** | 可禁用高风险操作 |
| **离线安装包** | 支持导出/导入，适配隔离网络环境 |

---

## 📄 License

[MIT License](./LICENSE)

---
