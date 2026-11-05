import type { Preview } from "@storybook/react"

import "../src/styles/globals.css"

/**
 * Shared Storybook preview. Renders every story on the design system's
 * background so token-driven classes (`bg-background`, `text-foreground`,
 * `border-border`, …) are visible exactly as they appear in the app.
 */
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-8 text-foreground antialiased">
        <Story />
      </div>
    ),
  ],
}

export default preview
