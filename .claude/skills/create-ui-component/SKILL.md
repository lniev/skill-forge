---
name: create-ui-component
description: 在 packages/ui 中按文件夹规范创建新的 React 组件，优先使用 shadcn/ui 官方组件
version: 2.0.0
---

# create-ui-component

当用户要求创建新的 UI 组件时，使用本 skill 按项目约定生成组件文件夹结构。

## 触发条件

用户表达以下任一意图时触发：

- "创建一个 Button 组件"
- "新建一个对话框组件"
- "帮我加一个 UI 组件"
- "按规范创建组件"

## 必须遵守的规范

组件位于：`packages/ui/src/components/<ComponentName>/`

目录结构：

```
packages/ui/src/components/<ComponentName>/
├── index.ts              # barrel 导出
├── <ComponentName>.tsx   # 主组件
├── types.ts              # 类型定义（需要时）
└── <ComponentName>*.tsx  # 子组件（如需要）
```

### 命名

- 文件夹：`PascalCase`
- 主组件文件：`ComponentName.tsx`
- 子组件文件：`ComponentNameSub.tsx`
- 类型文件：`types.ts`
- barrel 文件：`index.ts`

### 导出

- barrel 文件必须包含命名导出：

```ts
export { Component } from "./Component"
export type { ComponentProps } from "./types"
```

- 主组件可选默认导出：`export default Component`

### 引用路径

- 工具函数：`import { cn } from "../../../lib/utils"`
- 子组件/类型：相对路径 `./`

### 入口更新

创建组件后，必须在 `packages/ui/src/index.tsx` 中添加：

```ts
export { Component } from "./components/Component"
export type { ComponentProps } from "./components/Component"
```

## 执行步骤

1. 询问用户组件名称（如 `Button`、`Dialog`）。
2. 优先从 shadcn/ui 官方 registry 查找组件：
   - 在 `packages/ui` 目录下执行：
     ```bash
     pnpm dlx shadcn@latest search @shadcn --query <ComponentName>
     ```
   - 如果存在同名或高度匹配的官方组件（如 `button`、`dialog`、`table`），向用户展示搜索结果，询问是否使用 shadcn/ui 官方组件。
3. 用户确认使用 shadcn/ui 组件后：
   - 在 `packages/ui` 目录下执行：
     ```bash
     pnpm dlx shadcn@latest add <component-name>
     ```
   - shadcn 默认会安装到 `src/components/ui/<component-name>/`，需要把文件移动到 `src/components/<ComponentName>/`。
   - 删除空的 `src/components/ui/` 目录（如果为空）。
   - 按本规范生成 `index.ts` 和 `types.ts`（如需要）。
   - 更新 `packages/ui/src/index.tsx` 的导出。
4. 如果 shadcn/ui 没有合适组件，或用户选择不使用官方组件：
   - 询问是否需要子组件或共享类型。
   - 创建 `packages/ui/src/components/<ComponentName>/` 目录。
   - 生成 `index.ts`、`<ComponentName>.tsx`、`types.ts`（需要时）及子组件文件。
   - 更新 `packages/ui/src/index.tsx` 的导出。
5. 运行 `cd packages/ui && pnpm typecheck` 验证无类型错误。
6. 如果用户要求，可生成测试文件 `<component-name>.test.tsx`。

## shadcn/ui 组件示例

以添加 `Dialog` 组件为例：

```bash
cd packages/ui
pnpm dlx shadcn@latest search @shadcn --query dialog
```

如果搜索结果显示 `@shadcn/dialog` 可用，用户确认后执行：

```bash
pnpm dlx shadcn@latest add dialog
```

安装完成后，将 `src/components/ui/dialog.tsx` 移动到 `src/components/Dialog/Dialog.tsx`，并按规范创建 `index.ts` 等文件。

## 最小模板

### index.ts

```ts
export { Button } from "./Button"
export type { ButtonProps } from "./types"
```

### types.ts

```ts
import * as React from "react"

export interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}
```

### Button.tsx

```tsx
import * as React from "react"
import { cn } from "../../../lib/utils"
import type { ButtonProps } from "./types"

export function Button({ children, onClick, className }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800",
        className
      )}
    >
      {children}
    </button>
  )
}

export default Button
```

## 禁止事项

- 不要创建单文件组件。
- 不要把类型写死为 `any`。
- 不要修改 `packages/ui/src/index.tsx` 以外的入口。
- 不要依赖未在 `package.json` 中声明的深路径。
- 不要把 shadcn/ui 组件文件保留在 `src/components/ui/` 目录下，必须按项目规范移动到 `src/components/<ComponentName>/`。

## 参考示例

现有符合规范的组件：

- `packages/ui/src/components/Sidebar/` — 包含 `index.ts`、`types.ts`、子组件拆分及入口导出。
- `packages/ui/src/components/Button/`、`Card/`、`Table/`、`Badge/`、`Pagination/`、`Header/` — shadcn/ui 组件迁移后的规范示例。
