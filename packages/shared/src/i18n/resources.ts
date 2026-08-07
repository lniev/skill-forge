import { common as enCommon } from "./locales/en/common";
import { common as zhCommon } from "./locales/zh/common";

export const resources = {
  en: {
    common: enCommon,
  },
  zh: {
    common: zhCommon,
  },
} as const;

export type Resources = typeof resources;
