# 运行时 & 埋点接口

所有接口以 `/api/skills/:id` 为前缀。

---

## POST /api/skills/:id/invoke

调用指定 Skill。当前为 MVP stub，会记录调用日志。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `version` | `string` | 否 | 指定版本号，不传则使用 latest |
| `installId` | `string` | 否 | 关联的安装记录 ID |

### 请求体

任意 JSON，作为 Skill 的输入。

```json
{
  "email_content": "我要投诉你们的服务",
  "language": "zh"
}
```

### 响应

```json
{
  "success": true,
  "data": {
    "skillId": "email-classifier",
    "version": "2.1.0",
    "invokedAt": "2026-08-01T10:00:00.000Z",
    "runtimeType": "llm_prompt",
    "runtimeConfig": { /* ... */ },
    "input": { /* 调用输入 */ },
    "output": {
      "result": "ok",
      "note": "MVP invocation stub: integrate actual runtime here"
    }
  }
}
```

---

## GET /api/skills/:id/metrics

获取 Skill 调用指标统计。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `version` | `string` | 否 | 指定版本号，不传则统计全部版本 |

### 响应

```json
{
  "success": true,
  "data": {
    "total": 100,
    "success": 95,
    "failures": 5,
    "averageLatency": 120
  }
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `total` | `number` | 总调用次数 |
| `success` | `number` | 成功次数 |
| `failures` | `number` | 失败次数 |
| `averageLatency` | `number` | 平均延迟（毫秒） |
