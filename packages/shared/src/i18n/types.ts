import type { resources } from "./resources";

declare module "i18next" {
  interface CustomTypeOptions {
    resources: {
      common: (typeof resources)["en"]["common"];
    };
  }
}
