# Contract-first OpenAPI

The REST API does not exist yet — a FastAPI backend will implement it later. We author an OpenAPI 3.0 spec as the single source of truth and check it into the repo; from it we generate the MSW handlers (the mock), the TypeScript client types, and the artifact handed to the FastAPI team. Chosen over "write mocks first, extract the spec later" to guarantee the mock and the future backend agree on paths, payloads, and errors.
