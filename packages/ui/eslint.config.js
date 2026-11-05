import { config } from "@workspace/eslint-config/react-internal"

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      // The design system must stay domain-agnostic (spec: "Hard rule:
      // packages/ui never imports from apps/web"): nothing in `packages/ui`
      // may import from the `apps/web` app.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "@/**", "apps/*", "apps/**", "**/apps/**"],
              message:
                "packages/ui must not import from apps/web — keep the design system domain-agnostic.",
            },
          ],
        },
      ],
    },
  },
]
