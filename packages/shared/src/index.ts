export const APP_NAME = "SkillForge";
export const APP_VERSION = "0.0.1";

export function formatDate(date: Date | string | number): string {
  return new Date(date).toISOString();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
