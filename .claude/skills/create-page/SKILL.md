---
name: create-page
description: 在 apps/desktop/src/pages 中按文件夹规范创建新的页面组件
version: 1.0.0
---

# create-page

当用户要求创建新的页面时，使用本 skill 按项目约定生成页面文件夹结构。

## 触发条件

用户表达以下任一意图时触发：

- "创建一个 Dashboard 页面"
- "新建一个页面"
- "帮我加一个页面"
- "按规范创建页面"

## 必须遵守的规范

页面位于：`apps/desktop/src/pages/<PageName>/`

目录结构：

```
apps/desktop/src/pages/<PageName>/
├── index.ts              # barrel 导出
└── <PageName>.tsx        # 页面组件
```

### 命名

- 文件夹：`PascalCase`，与页面组件同名
- 主文件：`<PageName>.tsx`
- barrel 文件：`index.ts`

### 导出

- 页面组件使用默认导出：

```ts
export default function PageName() {
  return <div>...</div>
}
```

- barrel 文件重新导出默认导出：

```ts
export { default } from "./PageName"
```

### 引用路径

- 路由文件导入页面：

```ts
import PageName from "../pages/PageName"
```

### 路由更新

如果用户要求，在 `apps/desktop/src/routes/index.tsx` 中添加新页面路由：

```ts
import PageName from "../pages/PageName"

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // ...
      { path: "page-name", element: <PageName /> },
    ],
  },
])
```

## 执行步骤

1. 询问用户页面名称（如 `Dashboard`、`Settings`）。
2. 询问是否需要添加到路由。
3. 创建 `apps/desktop/src/pages/<PageName>/` 目录。
4. 生成 `<PageName>.tsx` 和 `index.ts`。
5. 如果需要，更新 `apps/desktop/src/routes/index.tsx`。
6. 运行 `cd apps/desktop && pnpm typecheck` 验证无类型错误。

## 最小模板

### index.ts

```ts
export { default } from "./Dashboard"
```

### Dashboard.tsx

```tsx
export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">页面描述</p>
    </div>
  )
}
```

## 禁止事项

- 不要创建单文件页面。
- 不要把页面组件放到 `components/` 下。
- 不要忘记创建 `index.ts`。
- 不要把类型写死为 `any`。

## 参考示例

现有符合规范的页面：

- `apps/desktop/src/pages/Dashboard/` — 包含 `Dashboard.tsx` 和 `index.ts`
- `apps/desktop/src/pages/Registry/`
- `apps/desktop/src/pages/Runtime/`
- `apps/desktop/src/pages/Evaluation/`
