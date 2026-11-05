import type { StorybookConfig } from "@storybook/react-vite"
import tailwindcss from "@tailwindcss/vite"

/**
 * Storybook config for the `@workspace/ui` design system.
 *
 * Vite is the builder (this is a plain React library, not a Next app), and the
 * Tailwind v4 Vite plugin processes `src/styles/globals.css` so the primitives
 * render against the same design tokens as the app.
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    config.plugins = [...(config.plugins ?? []), tailwindcss()]
    return config
  },
}

export default config
