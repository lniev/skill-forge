# Skill 分类体系

本文件定义 Skill 管理平台中的 `category` 字段规范。

## 当前已有分类

### 桌面端 Registry 页面

| 分类 ID | 展示名称 |
|---|---|
| `nlp` | NLP/分类 |
| `text` | 文本生成 |
| `extract` | 信息提取 |
| `data` | 数据处理 |

### Skills Desktop 实际数据

- `NLP/分类`
- `文本生成`
- `信息提取`
- `数据处理`

### 产品方案中提到的分类

- 客服
- 运营
- 供应链
- NLP
- 生成
- 提取

## 推荐分类体系

建议采用 **技术能力为主、业务场景为辅** 的二级分类：

```yaml
category: "nlp/classification"
subCategory: "customer-service"
```

### 按技术能力分类

| 分类 | 说明 |
|---|---|
| `nlp/classification` | NLP/分类 |
| `nlp/extraction` | 信息提取 |
| `nlp/generation` | 文本生成 |
| `nlp/summarization` | 文本摘要 |
| `nlp/translation` | 翻译 |
| `code/script` | 代码脚本 |
| `data/transform` | 数据处理 |
| `workflow` | 工作流 |
| `vision` | 视觉/图像 |
| `audio` | 语音/音频 |

### 按业务场景分类

| 分类 | 说明 |
|---|---|
| `customer-service` | 客服 |
| `operations` | 运营 |
| `supply-chain` | 供应链 |
| `sales` | 销售 |
| `marketing` | 市场 |
| `hr` | 人力资源 |
| `finance` | 财务 |
| `legal` | 法务 |
| `it` | IT/研发 |

## 单字段表示法

如果只需要一个字段，可以使用组合形式：

```yaml
category: "nlp/classification#customer-service"
```

其中 `#` 前为技术能力分类，`#` 后为业务场景分类。

## 扩展建议

- 分类值使用英文小写，单词间用 `-` 连接
- 支持多级分类，使用 `/` 分隔
- 前端展示时映射为中文
- 分类体系应支持动态扩展，不建议硬编码在前端代码中

## 相关文档

- [产品方案](./product-spec.md)
- [上传 Skill 页面产品文档](./upload-skill.md)
- [后端 Skill 存储技术方案](./skill-storage-technical-design.md)
