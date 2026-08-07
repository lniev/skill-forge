# 资源文件接口

所有接口以 `/api/skills/:id/versions/:version/assets` 为前缀。

---

## POST /api/skills/:id/versions/:version/assets

上传资源文件到指定 Skill 版本。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |
| `version` | `string` | 版本号 |

### 请求体

`multipart/form-data`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `file` | `File` | 是 | 要上传的文件，支持多文件 |

### 响应

```json
{
  "success": true,
  "data": [
    {
      "type": "prompt",
      "path": "skills/email-classifier/2.1.0/prompt_v2.1.txt",
      "size": 1024,
      "contentType": "text/plain"
    }
  ]
}
```

---

## GET /api/skills/:id/versions/:version/assets/:name

下载或查看指定资源。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |
| `version` | `string` | 版本号 |
| `name` | `string` | 文件名 |

### 响应

返回文件二进制流，响应头包含对应的 `Content-Type`。

---

## DELETE /api/skills/:id/versions/:version/assets/:name

删除指定资源，并从版本 `assetRefs` 中移除引用。

### 路径参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | Skill 主键 ID |
| `version` | `string` | 版本号 |
| `name` | `string` | 文件名 |

### 响应

```json
{
  "success": true,
  "data": null
}
```
