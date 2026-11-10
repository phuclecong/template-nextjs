import { describe, expect, it } from "vitest"
import { toCrudFilters } from "@/features/tasks/utils"

const emptyFilters = {
  status: "",
  priority: "",
  assignee: "",
  dueFrom: "",
  dueTo: "",
}

describe("toCrudFilters", () => {
  it("returns an empty list when there is no query or filter", () => {
    expect(toCrudFilters("", emptyFilters)).toEqual([])
  })

  it("maps the search query to a contains filter", () => {
    expect(toCrudFilters("fix", emptyFilters)).toEqual([
      { field: "q", operator: "contains", value: "fix" },
    ])
  })

  it("maps status and priority to eq filters", () => {
    expect(
      toCrudFilters("", { ...emptyFilters, status: "done", priority: "high" })
    ).toEqual([
      { field: "status", operator: "eq", value: "done" },
      { field: "priority", operator: "eq", value: "high" },
    ])
  })

  it("maps assignee to assigneeId and due dates to a range", () => {
    expect(
      toCrudFilters("", {
        ...emptyFilters,
        assignee: "usr_1",
        dueFrom: "2026-01-01",
        dueTo: "2026-01-31",
      })
    ).toEqual([
      { field: "assigneeId", operator: "eq", value: "usr_1" },
      { field: "dueDate", operator: "gte", value: "2026-01-01" },
      { field: "dueDate", operator: "lte", value: "2026-01-31" },
    ])
  })

  it("skips empty filter values", () => {
    expect(
      toCrudFilters("", { ...emptyFilters, priority: "", dueFrom: "" })
    ).toEqual([])
  })
})
