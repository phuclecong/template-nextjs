import simpleRestDataProvider from "@refinedev/simple-rest"

/**
 * Refine dataProvider pointed at the mock API (ADR-0002, ADR-0005). The
 * in-browser MSW worker that serves these routes is wired in the data-fetching
 * issue; nothing here issues requests until a view calls a Refine data hook.
 */
export const apiUrl = "/api"

export const dataProvider = simpleRestDataProvider(apiUrl)
