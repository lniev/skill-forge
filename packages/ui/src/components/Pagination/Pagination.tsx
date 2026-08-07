import * as React from "react"
import { cn } from "../../lib/utils"
import type { PaginationProps } from "./types"

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = React.useMemo(() => {
    const items: (number | "ellipsis")[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) items.push(i)
        items.push("ellipsis")
        items.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        items.push(1)
        items.push("ellipsis")
        for (let i = totalPages - 4; i <= totalPages; i++) items.push(i)
      } else {
        items.push(1)
        items.push("ellipsis")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) items.push(i)
        items.push("ellipsis")
        items.push(totalPages)
      }
    }

    return items
  }, [currentPage, totalPages])

  if (totalPages <= 1) return null

  return (
    <nav className={cn("flex items-center justify-center gap-2", className)}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="flex h-9 w-9 items-center justify-center text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
              currentPage === page
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary"
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </nav>
  )
}

export default Pagination
