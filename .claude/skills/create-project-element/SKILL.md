---
name: create-project-element
description: 根据项目规范创建 UI 组件或页面，自动分发到对应的子 skill
version: 1.0.0
---

# create-project-element

本 skill 是项目元素创建的统一入口。根据用户意图，自动分发到对应的子 skill 执行。

## 子 skill 列表

| 子 skill | 用途 | 触发条件 |
|----------|------|----------|
| `create-ui-component` | 创建 UI 组件 | 用户要求创建组件、UI 元素 |
| `create-page` | 创建页面 | 用户要求创建页面、路由页面 |

## 触发条件

用户表达以下任一意图时触发：

- "帮我创建一个新的组件"
- "帮我创建一个新的页面"
- "新建一个 UI 元素"
- "按项目规范创建"

## 分发规则

### 1. 创建 UI 组件

如果用户提到以下关键词，使用 `create-ui-component` skill：

- 组件
- Button、Dialog、Input、Card 等 UI 元素名称
- `packages/ui/src/components/`

请调用 `/create-ui-component` 或等价的子 skill。

### 2. 创建页面

如果用户提到以下关键词，使用 `create-page` skill：

- 页面
- Page
- Dashboard、Settings、Profile 等页面名称
- `apps/desktop/src/pages/`

请调用 `/create-page` 或等价的子 skill。

## 执行步骤

1. 识别用户意图：创建组件还是创建页面。
2. 如果意图不明确，询问用户："是创建 UI 组件还是页面？"
3. 调用对应的子 skill。
4. 子 skill 执行完成后，汇总结果给用户。

## 规范汇总

### UI 组件规范

- 位置：`packages/ui/src/components/<ComponentName>/`
- 文件：`index.ts`、`<ComponentName>.tsx`、`types.ts`、子组件文件
- 导出：barrel 导出，更新 `packages/ui/src/index.tsx`
- 验证：`cd packages/ui && pnpm typecheck`

### 页面规范

- 位置：`apps/desktop/src/pages/<PageName>/`
- 文件：`index.ts`、`<PageName>.tsx`
- 导出：页面默认导出，barrel 重新导出
- 路由：可选更新 `apps/desktop/src/routes/index.tsx`
- 验证：`cd apps/desktop && pnpm typecheck`

## 禁止事项

- 不要混淆组件和页面的位置。
- 不要创建单文件组件或页面。
- 不要跳过 `index.ts` barrel 文件。
- 不要忘记运行 typecheck。

## 扩展预留

本 skill 后续可继续添加更多子 skill：

- `create-hook`：创建自定义 Hook
- `create-api`：创建 API service
- `create-test`：创建测试文件

添加新子 skill 后，在本 skill 的「子 skill 列表」和「分发规则」中更新对应条目即可。
