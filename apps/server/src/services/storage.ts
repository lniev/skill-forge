import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import fs from "node:fs"
import path from "node:path"

export interface StoredAsset {
  type: string
  path: string
  size: number
  contentType?: string
}

export interface StorageProvider {
  write(skillId: string, version: string, filename: string, data: Buffer, contentType?: string): Promise<StoredAsset>
  read(skillId: string, version: string, filename: string): Promise<Buffer | undefined>
  exists(skillId: string, version: string, filename: string): Promise<boolean>
  remove(skillId: string, version: string, filename: string): Promise<boolean>
  buildKey(skillId: string, version: string, filename: string): string
}

class LocalStorageProvider implements StorageProvider {
  constructor(private baseDir: string) {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true })
    }
  }

  buildKey(skillId: string, version: string, filename: string): string {
    const safeSkillId = skillId.replace(/[^a-zA-Z0-9_-]/g, "_")
    const safeVersion = version.replace(/[^a-zA-Z0-9_.-]/g, "_")
    const safeFilename = path.basename(filename)
    return `skills/${safeSkillId}/${safeVersion}/${safeFilename}`
  }

  private buildLocalPath(key: string): string {
    return path.join(this.baseDir, key)
  }

  async write(skillId: string, version: string, filename: string, data: Buffer, contentType?: string): Promise<StoredAsset> {
    const key = this.buildKey(skillId, version, filename)
    const filePath = this.buildLocalPath(key)
    const dir = path.dirname(filePath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(filePath, data)

    return {
      type: inferAssetType(filename),
      path: key,
      size: data.length,
      contentType,
    }
  }

  async read(skillId: string, version: string, filename: string): Promise<Buffer | undefined> {
    const key = this.buildKey(skillId, version, filename)
    const filePath = this.buildLocalPath(key)

    if (!fs.existsSync(filePath)) {
      return undefined
    }

    return fs.readFileSync(filePath)
  }

  async exists(skillId: string, version: string, filename: string): Promise<boolean> {
    const key = this.buildKey(skillId, version, filename)
    const filePath = this.buildLocalPath(key)
    return fs.existsSync(filePath)
  }

  async remove(skillId: string, version: string, filename: string): Promise<boolean> {
    const key = this.buildKey(skillId, version, filename)
    const filePath = this.buildLocalPath(key)

    if (!fs.existsSync(filePath)) {
      return false
    }

    fs.unlinkSync(filePath)
    return true
  }
}

class S3StorageProvider implements StorageProvider {
  private client: S3Client
  private bucket: string
  private endpoint: string

  constructor(config: { endpoint: string; region: string; accessKeyId: string; secretAccessKey: string; bucket: string }) {
    this.endpoint = config.endpoint
    this.bucket = config.bucket
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    })
  }

  buildKey(skillId: string, version: string, filename: string): string {
    const safeSkillId = skillId.replace(/[^a-zA-Z0-9_-]/g, "_")
    const safeVersion = version.replace(/[^a-zA-Z0-9_.-]/g, "_")
    const safeFilename = path.basename(filename)
    return `skills/${safeSkillId}/${safeVersion}/${safeFilename}`
  }

  async write(skillId: string, version: string, filename: string, data: Buffer, contentType?: string): Promise<StoredAsset> {
    const key = this.buildKey(skillId, version, filename)

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType ?? inferContentType(filename),
      })
    )

    return {
      type: inferAssetType(filename),
      path: key,
      size: data.length,
      contentType: contentType ?? inferContentType(filename),
    }
  }

  async read(skillId: string, version: string, filename: string): Promise<Buffer | undefined> {
    const key = this.buildKey(skillId, version, filename)

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      )

      if (!response.Body) {
        return undefined
      }

      const arrayBuffer = await response.Body.transformToByteArray()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      return undefined
    }
  }

  async exists(skillId: string, version: string, filename: string): Promise<boolean> {
    const key = this.buildKey(skillId, version, filename)

    try {
      await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      )
      return true
    } catch {
      return false
    }
  }

  async remove(skillId: string, version: string, filename: string): Promise<boolean> {
    const key = this.buildKey(skillId, version, filename)

    try {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3")
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      )
      return true
    } catch {
      return false
    }
  }
}

export function createStorageService(): StorageProvider {
  const type = process.env.STORAGE_TYPE ?? "local"

  if (type === "s3") {
    const endpoint = process.env.S3_ENDPOINT
    const region = process.env.S3_REGION ?? "us-east-1"
    const accessKeyId = process.env.S3_ACCESS_KEY
    const secretAccessKey = process.env.S3_SECRET_KEY
    const bucket = process.env.S3_BUCKET

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error("Missing S3 configuration. Required: S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET")
    }

    return new S3StorageProvider({ endpoint, region, accessKeyId, secretAccessKey, bucket })
  }

  const baseDir = process.env.STORAGE_DIR ?? "./data/storage"
  return new LocalStorageProvider(baseDir)
}

function inferAssetType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  switch (ext) {
    case ".txt":
      return "prompt"
    case ".py":
    case ".js":
      return "script"
    case ".json":
    case ".jsonl":
      return "dataset"
    case ".png":
    case ".jpg":
    case ".jpeg":
    case ".svg":
      return "icon"
    default:
      return "asset"
  }
}

function inferContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const contentTypeMap: Record<string, string> = {
    ".txt": "text/plain",
    ".py": "text/plain",
    ".js": "text/plain",
    ".json": "application/json",
    ".jsonl": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
  }
  return contentTypeMap[ext] ?? "application/octet-stream"
}
