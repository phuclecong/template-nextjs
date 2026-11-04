import { readFileSync } from "node:fs"
import { fromOpenApi } from "@msw/source/open-api"
import { dataHandlers } from "./data-handlers"

// The OpenAPI spec is the single source of truth. `fromOpenApi` generates a
// handler for every documented operation, which serves as the spec-derived
// fallback; the data-backed handlers take precedence so the mock is stateful
// (reads/writes the @msw/data collections).
const spec = readFileSync(new URL("../openapi.yaml", import.meta.url), "utf8")

export const specHandlers = await fromOpenApi(spec)

export const handlers = [...dataHandlers, ...specHandlers]
