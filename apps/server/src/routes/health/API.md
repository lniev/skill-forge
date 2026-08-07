# Health 接口

## GET /api/health

健康检查接口，用于确认服务是否正常运行。

### 请求参数

无

### 响应

```json
{
  "status": "ok",
  "timestamp": "2026-08-01T09:33:12.004Z"
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `status` | `string` | 服务状态，`ok` 或 `error` |
| `timestamp` | `string` | ISO 8601 格式的时间戳 |
