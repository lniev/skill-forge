import { cn } from "@skill-platform/ui"

interface IconProps {
  name: string
  className?: string
}

export function Icon({ name, className }: IconProps) {
  return (
    <svg className={cn("h-4 w-4 shrink-0", className)}>
      <use href={`/icons/sprite.svg#${name}`} />
    </svg>
  )
}
