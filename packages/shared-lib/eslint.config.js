import { config } from "@workspace/eslint-config/react-internal"

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      // Shared modules must stay app-agnostic (mirroring the design system's
      // hard rule): nothing in `packages/shared-lib` may import from `apps/web`.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "@/**", "apps/*", "apps/**", "**/apps/**"],
              message:
                "packages/shared-lib must not import from apps/web — keep shared modules app-agnostic.",
            },
          ],
        },
      ],
    },
  },
]
