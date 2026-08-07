import type { ComponentProps } from "react"
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./Toast"
import { useToast, type ToastType } from "./useToast"

const iconMap: Record<ToastType, ComponentProps<typeof CheckCircle2>> = {
  success: { className: "h-5 w-5 text-emerald-500" },
  error: { className: "h-5 w-5 text-red-500" },
  warning: { className: "h-5 w-5 text-amber-500" },
  info: { className: "h-5 w-5 text-blue-500" },
}

function ToastIcon({ type }: { type: ToastType }) {
  const props = iconMap[type]
  switch (type) {
    case "success":
      return <CheckCircle2 {...props} />
    case "error":
      return <XCircle {...props} />
    case "warning":
      return <AlertCircle {...props} />
    case "info":
      return <Info {...props} />
    default:
      return null
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, toastType, ...props }) => (
        <Toast key={id} {...props}>
          <div className="flex w-full items-start gap-3">
            {toastType && <ToastIcon type={toastType} />}
            <div className="grid flex-1 gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
