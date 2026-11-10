"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { OnChangeFn, SortingState } from "@tanstack/react-table"
import type { CrudSort } from "@refinedev/core"
import { debounce } from "../utils"

const DEFAULT_PAGE_SIZE = 30
const SEARCH_DEBOUNCE_MS = 300

type SortOrder = "asc" | "desc"

export type TableStateOptions<TFilterKey extends string = string> = {
  /** Default column id to sort by when the URL has no `sort` param. */
  defaultSortField: string
  /** Default direction when the URL has no `order` param. Defaults to `"asc"`. */
  defaultSortOrder?: SortOrder
  /** Page size when the URL has no `pageSize` param. Defaults to `30`. */
  defaultPageSize?: number
  /** Debounce delay (ms) before the search input is written to the URL. */
  searchDebounceMs?: number
  /**
   * URL param keys (besides `q`, `sort`, `order`, `page`, `pageSize`) that the
   * table reads. Their values are returned as a typed `filterValues` record
   * and, when they change, the row selection is reset. Pass a stable,
   * module-level `as const` array so the keys are inferred literally and the
   * reference stays stable across renders.
   */
  filterKeys?: readonly TFilterKey[]
}

/**
 * URL-driven state for a data table: search, filters, sort, and pagination are
 * read from (and written back to) the URL, plus row-selection state that is
 * reset when the page, filters, or sort change. Everything here is reusable
 * across tables; the table itself still owns its columns, data fetching, and
 * any row/bulk actions.
 */
export function useTableState<const TFilterKey extends string = string>(
  options: TableStateOptions<TFilterKey>
) {
  const {
    defaultSortField,
    defaultSortOrder = "asc",
    defaultPageSize = DEFAULT_PAGE_SIZE,
    searchDebounceMs = SEARCH_DEBOUNCE_MS,
    filterKeys = [],
  } = options

  const rawSearchParams = useSearchParams()
  // `useSearchParams()` is `null` during SSR; normalize once so downstream
  // `useMemo`s (and the URL writer) see a stable, non-null object.
  const searchParams = useMemo(
    () => rawSearchParams ?? new URLSearchParams(),
    [rawSearchParams]
  )
  const router = useRouter()
  const pathname = usePathname() ?? ""

  // The URL is the single source of truth for search, filters, sort, and page.
  const q = searchParams.get("q") ?? ""
  const sortField = searchParams.get("sort") ?? defaultSortField
  const sortDesc = (searchParams.get("order") ?? defaultSortOrder) === "desc"
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1)
  const pageSize = Math.max(
    1,
    Number(searchParams.get("pageSize")) || defaultPageSize
  )

  const filterValues = useMemo(() => {
    const result = {} as Record<TFilterKey, string>
    for (const key of filterKeys) {
      result[key] = searchParams.get(key) ?? ""
    }
    return result
  }, [filterKeys, searchParams])

  // Stable URL writer that always reads the freshest navigation state, so the
  // returned `updateParams` stays referentially stable.
  const writeRef = useRef<
    (next: Record<string, string>, replace?: boolean) => void
  >(() => {})
  writeRef.current = (next, replace) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value === "" || value == null) params.delete(key)
      else params.set(key, value)
    }
    const qs = params.toString()
    const href = pathname + (qs ? `?${qs}` : "")
    if (replace) router.replace(href)
    else router.push(href)
  }
  const updateParams = useCallback(
    (next: Record<string, string>, replace?: boolean) => {
      writeRef.current(next, replace)
    },
    []
  )

  // Search input is locally controlled for typing feel; its value is written
  // to the URL (debounced) and mirrored back when the URL changes externally.
  const [searchValue, setSearchValue] = useState(q)
  const lastQueryRef = useRef(q)

  useEffect(() => {
    if (q !== lastQueryRef.current) {
      setSearchValue(q)
      lastQueryRef.current = q
    }
  }, [q])

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        lastQueryRef.current = value
        updateParams({ q: value, page: "" }, true)
      }, searchDebounceMs),
    [updateParams, searchDebounceMs]
  )
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch])

  const onSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const sorters = useMemo<CrudSort[]>(
    () => [{ field: sortField, order: sortDesc ? "desc" : "asc" }],
    [sortField, sortDesc]
  )

  const sorting = useMemo<SortingState>(
    () => [{ id: sortField, desc: sortDesc }],
    [sortField, sortDesc]
  )

  const onSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      const sort = next[0]
      if (sort) {
        updateParams({
          sort: sort.id,
          order: sort.desc ? "desc" : "asc",
          page: "",
        })
      }
    },
    [sorting, updateParams]
  )

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // A page, filter, or sort change invalidates the current selection. Search
  // (`q`) is intentionally excluded, matching the original table's behaviour.
  const filterSignature = useMemo(
    () =>
      filterKeys
        .map((key) => `${key}=${searchParams.get(key) ?? ""}`)
        .join("&"),
    [filterKeys, searchParams]
  )

  useEffect(() => {
    setRowSelection({})
  }, [page, pageSize, sortField, sortDesc, filterSignature])

  const selectedIds = useMemo(() => Object.keys(rowSelection), [rowSelection])

  return {
    // Search
    q,
    searchValue,
    onSearchChange,
    // Filters
    filterValues,
    // Sort
    sortField,
    sortDesc,
    sorters,
    sorting,
    onSortingChange,
    // Pagination
    page,
    pageSize,
    // Selection
    rowSelection,
    setRowSelection,
    selectedIds,
    hasSelection: selectedIds.length > 0,
    // Navigation
    updateParams,
  }
}

export type TableState = ReturnType<typeof useTableState>
export type TableRowSelection = Dispatch<
  SetStateAction<Record<string, boolean>>
>
