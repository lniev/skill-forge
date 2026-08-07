import { useEffect } from "react"
import { Header } from "../Header"
import { useHeaderActions } from "../../store/headerStore"

interface LayoutHeaderProps {
  title?: string
}

export function LayoutHeader({ title }: LayoutHeaderProps) {
  const { setLeft, resetHeader } = useHeaderActions()

  useEffect(() => {
    setLeft(
      <div data-tauri-drag-region className="select-none">
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      </div>
    )
    return () => {
      resetHeader()
    }
  }, [setLeft, resetHeader, title])

  return <Header />
}
