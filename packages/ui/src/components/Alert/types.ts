import type { VariantProps } from "class-variance-authority"
import type { Alert } from "./Alert"
import type { alertVariants } from "./Alert"

export type AlertProps = React.ComponentPropsWithoutRef<typeof Alert> &
  VariantProps<typeof alertVariants>
