# UI 组件开发规范

本规范适用于 `packages/ui/src/components/` 下的所有 React 组件。

## 目录结构

每个组件必须是一个文件夹，位于 `packages/ui/src/components/<ComponentName>/`：

```
packages/ui/src/components/<ComponentName>/
├── index.ts                      # barrel：统一导出 public API
├── <ComponentName>.tsx           # 主组件
├── types.ts                      # props / item / section 等共享类型
├── <ComponentName>*.tsx          # 子组件，PascalCase 命名
├── icons.tsx                     # 仅在组件内部使用的图标
└── <component-name>.test.tsx      # 同目录测试文件
```

## 命名规则

| 项目 | 规则 | 示例 |
|------|------|------|
| 文件夹 | PascalCase，与主组件同名 | `Sidebar/`、`Button/` |
| 主组件文件 | `ComponentName.tsx` | `Sidebar.tsx` |
| 子组件文件 | `ComponentNameSub.tsx` | `SidebarHeader.tsx` |
| 类型文件 | `types.ts` | `types.ts` |
| barrel 文件 | `index.ts` | `index.ts` |

## 导出规则

1. **组件用命名导出**，在 `index.ts` 中集中暴露：

```ts
export { Sidebar } from "./Sidebar"
export type { SidebarProps, SidebarItem, SidebarSection, SidebarBadge } from "./types"
```

2. 主组件内可额外提供默认导出（兼容既有 import 风格）：

```ts
export default Sidebar
```

3. 外部入口 `packages/ui/src/index.tsx` 必须同步更新：

```ts
export { Component } from "./components/ui/Component"
export type { ComponentProps } from "./components/ui/Component"
```

## 内部引用

- 包内工具使用相对路径：

```ts
import { cn } from "../../lib/utils"
```

- 子组件之间使用相对路径：

```ts
import { SidebarHeader } from "./SidebarHeader"
import type { SidebarProps } from "./types"
```

## 类型拆分

- props 类型简单时可直接写在主组件文件内。
- 存在多个共享类型（如 item、section、badge）时统一放到 `types.ts`。
- 子组件 props 定义在各自文件内即可。

## 样式规则

- 使用 Tailwind CSS 进行样式描述。
- 复杂 className 组合使用 `cn()` 工具函数：

```ts
className={cn("base-class", condition && "conditional-class", className)}
```

- 保持项目现有视觉风格：zinc 配色、圆角、过渡动画。
- 组件应支持 `className` prop，并合并到根节点。

## 受控与非受控

组件内部状态需要支持外部受控时，遵循以下模式：

```ts
interface Props {
  value?: boolean
  onChange?: (value: boolean) => void
}

function Component({ value: valueProp, onChange }: Props) {
  const [internalValue, setInternalValue] = useState(false)
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : internalValue

  const setValue = useCallback((next: boolean) => {
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }, [isControlled, onChange])

  // ...
}
```

## 禁止事项

- 不要创建单文件组件。
- 不要把类型写死为 `any`。
- 不要忘记更新 `packages/ui/src/index.tsx`。
- 不要依赖未在 `package.json` `exports` 中声明的深路径。
