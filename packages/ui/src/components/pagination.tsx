"use client"

import { cn } from "cn"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "./button"

function pageItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const items: Array<number | "ellipsis"> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) items.push("ellipsis")
  for (let p = start; p <= end; p++) items.push(p)
  if (end < total - 1) items.push("ellipsis")
  items.push(total)
  return items
}

function Pagination({
  page,
  pageCount,
  onPageChange,
  label = "Pagination",
  prevLabel = "Previous page",
  nextLabel = "Next page",
  pageLabel = "Page {page}",
  className,
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  label?: string
  prevLabel?: string
  nextLabel?: string
  pageLabel?: string
  className?: string
}) {
  if (pageCount <= 1) return null

  return (
    <nav
      aria-label={label}
      className={cn("flex items-center gap-1", className)}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={prevLabel}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeftIcon />
      </Button>
      {pageItems(page, pageCount).map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden="true"
            className="px-1 text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant={item === page ? "default" : "outline"}
            size="icon-sm"
            aria-current={item === page ? "page" : undefined}
            aria-label={pageLabel.replace("{page}", String(item))}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        )
      )}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={nextLabel}
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRightIcon />
      </Button>
    </nav>
  )
}

export { Pagination }
