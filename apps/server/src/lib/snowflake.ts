/**
 * Snowflake ID 生成器
 *
 * 64 位有序 ID 结构：
 * - 1 bit  符号位（始终为 0）
 * - 41 bits 时间戳（毫秒，相对自定义 epoch）
 * - 10 bits 工作节点 ID
 * - 12 bits 序列号
 *
 * 生成的 ID 以数字字符串形式返回，保证唯一、有序、时间相关。
 */
export class SnowflakeGenerator {
  private readonly epoch: number
  private readonly workerId: number
  private sequence: number
  private lastTimestamp: number

  constructor(options: { epoch?: number; workerId?: number } = {}) {
    this.epoch = options.epoch ?? 1704067200000 // 2024-01-01 00:00:00 UTC
    this.workerId = options.workerId ?? 0
    this.sequence = 0
    this.lastTimestamp = -1

    if (this.workerId < 0 || this.workerId > 1023) {
      throw new Error("workerId must be between 0 and 1023")
    }
  }

  nextId(): string {
    let timestamp = Date.now()

    if (timestamp < this.lastTimestamp) {
      throw new Error("Clock moved backwards. Refusing to generate id.")
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & 0xfff
      if (this.sequence === 0) {
        timestamp = this.waitNextMillis(timestamp)
      }
    } else {
      this.sequence = 0
    }

    this.lastTimestamp = timestamp

    const id =
      (BigInt(timestamp - this.epoch) << 22n) |
      (BigInt(this.workerId) << 12n) |
      BigInt(this.sequence)

    return id.toString()
  }

  private waitNextMillis(timestamp: number): number {
    while (Date.now() <= timestamp) {
      // busy wait
    }
    return Date.now()
  }
}

const defaultSnowflake = new SnowflakeGenerator()

export function snowflakeId(): string {
  return defaultSnowflake.nextId()
}
