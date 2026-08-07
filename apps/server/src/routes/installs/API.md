# 安装管理接口

安装申请相关接口。

---

## GET /api/installs

查询安装记录列表。

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `skillId` | `string` | 否 | 按 Skill ID 筛选 |
| `appId` | `string` | 否 | 按目标应用 ID 筛选 |
| `limit` | `number` | 否 | 返回数量，默认 20 |
| `offset` | `number` | 否 | 偏移量，默认 0 |

### 响应

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "skillId": "...",
      "version": "2.1.0",
      "targetAppId": "app-001",
      "targetEnv": "prod",
      "status": "applying",
      "createdAt": "..."
    }
  ]
}
```

---

## POST /api/skills/:id/install

申请安装某个 Skill 版本。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `version` | `string` | 是 | 要安装的版本号 |
| `targetAppId` | `string` | 是 | 宿主应用 ID |
| `targetEnv` | `string` | 否 | 环境：`dev`、`staging`、`prod`，默认 `dev` |
| `customConfig` | `object` | 否 | 业务方自定义配置 |
| `permissions` | `string[]` | 否 | 已授权权限 |

### 响应

```json
{
  "success": true,
  "data": { /* 安装记录 */ }
}
```

---

## GET /api/installs/:installId

获取安装记录详情。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `installId` | `string` | 安装记录 ID |

### 响应

```json
{
  "success": true,
  "data": { /* SkillInstall 详情 */ }
}
```

---

## GET /api/installs/:installId/config

运行时拉取安装配置，包含版本运行时配置、输入输出 schema、资源引用等。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `installId` | `string` | 安装记录 ID |

### 响应

```json
{
  "success": true,
  "data": {
    "installId": "...",
    "skillId": "...",
    "version": "2.1.0",
    "runtimeConfig": { /* ... */ },
    "inputSchema": [ /* ... */ ],
    "outputSchema": [ /* ... */ ],
    "dependencies": [ /* ... */ ],
    "permissions": [ /* ... */ ],
    "customConfig": { /* ... */ },
    "assetRefs": [ /* ... */ ]
  }
}
```

---

## PATCH /api/installs/:installId/status

修改安装记录状态。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `installId` | `string` | 安装记录 ID |

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `status` | `string` | 是 | `applying`、`approved`、`rejected`、`installed`、`uninstalled` |

### 响应

```json
{
  "success": true,
  "data": { /* 更新后的安装记录 */ }
}
```

---

## POST /api/installs/:installId/approve

审批通过安装申请。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `installId` | `string` | 安装记录 ID |

### 响应

```json
{
  "success": true,
  "data": { /* 更新后的安装记录 */ }
}
```

---

## POST /api/installs/:installId/reject

拒绝安装申请。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `installId` | `string` | 安装记录 ID |

### 响应

```json
{
  "success": true,
  "data": { /* 更新后的安装记录 */ }
}
```
