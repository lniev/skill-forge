# @skill-platform/server

后端服务，基于 Hono + TypeScript + SQLite 构建。

## 目录结构

```
src/
├── db/              # 数据库 schema、连接、迁移
├── repositories/    # 数据仓储
├── routes/          # Hono 路由
├── services/        # 业务服务
└── index.ts         # 服务入口
```

## 启动前准备

```bash
# 安装依赖
pnpm install

# 复制环境变量示例
cp .env.example .env

# 初始化数据库
pnpm db:migrate
```

## 环境变量配置

复制 `.env.example` 到 `.env` 后按需修改：

```bash
cp .env.example .env
```

默认 `.env`：

```bash
PORT=3000
DATABASE_URL=./data/skill-platform.sqlite
STORAGE_TYPE=local
STORAGE_DIR=./data/storage
```

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动开发服务（默认端口 3000） |
| `pnpm build` | 构建 |
| `pnpm start` | 启动生产服务 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm db:migrate` | 执行数据库初始化/迁移 |

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| `PORT` | 否 | `3000` | 服务端口号 |
| `DATABASE_URL` | 否 | `./data/skill-platform.sqlite` | SQLite 数据库文件路径 |
| `STORAGE_TYPE` | 否 | `local` | 存储模式：`local` 或 `s3` |
| `STORAGE_DIR` | 否 | `./data/storage` | 本地存储目录 |
| `S3_ENDPOINT` | 否 | - | S3/MinIO 端点 |
| `S3_REGION` | 否 | `us-east-1` | S3 区域 |
| `S3_ACCESS_KEY` | 否 | - | S3 Access Key |
| `S3_SECRET_KEY` | 否 | - | S3 Secret Key |
| `S3_BUCKET` | 否 | - | S3 Bucket 名称 |

## 本地开发

```bash
# 启动后端服务
pnpm dev

# 或者通过根目录启动
pnpm dev:server
```

## 数据库

后端默认使用 SQLite，数据库文件会生成在 `data/skill-platform.sqlite`。无需额外安装数据库。

执行迁移：

```bash
pnpm db:migrate
```

## 文件存储

### 本地存储（默认）

文件会存储在 `STORAGE_DIR` 指定的目录下：

```
data/storage/
  skills/
    {skillId}/
      {version}/
        prompt.txt
        icon.png
        ...
```

### MinIO/S3 存储

使用 MinIO 时，先启动 Docker Compose 中的 MinIO 服务：

```bash
# 在项目根目录执行
docker compose up -d minio
```

访问控制台创建 bucket：

- 控制台地址：`http://localhost:9001`
- 默认账号：`minioadmin`
- 默认密码：`minioadmin`

然后启动后端：

```bash
STORAGE_TYPE=s3 \
S3_ENDPOINT=http://localhost:9000 \
S3_ACCESS_KEY=minioadmin \
S3_SECRET_KEY=minioadmin \
S3_BUCKET=skill-platform \
pnpm dev
```

## API 文档

各模块接口文档位于对应路由目录下的 `API.md`：

```
src/routes/
├── health/API.md
├── skills/API.md
├── assets/API.md
├── installs/API.md
└── invoke/API.md
```

## CORS

开发环境默认允许以下来源访问：

- `http://localhost:1420`
- `http://localhost:3000`
- `http://127.0.0.1:1420`

## 接口路由前缀

所有 API 接口均以 `/api` 为前缀。

示例：

```
GET  /api/health
GET  /api/skills
POST /api/skills
```
