import * as React from "react"
import { cn } from "../../lib/utils"
import type { HeaderProps } from "./types"

export function Header({ left, center, right, className, style, ...rest }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-14 items-center border-b border-border bg-card/80 px-4 backdrop-blur-xl",
        className
      )}
      style={style}
      {...rest}
    >
      <div className="flex flex-1 items-center justify-start gap-2">{left}</div>
      {center && (
        <div className="flex flex-1 items-center justify-center gap-2">
          {center}
        </div>
      )}
      <div className="flex flex-1 items-center justify-end gap-2">{right}</div>
    </header>
  )
}

export default Header
