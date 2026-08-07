import * as React from "react"

export interface HeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, "left" | "center" | "right"> {
  left?: React.ReactNode
  center?: React.ReactNode
  right?: React.ReactNode
}
