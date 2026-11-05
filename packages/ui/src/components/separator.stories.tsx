import type { Meta, StoryObj } from "@storybook/react"

import { Separator } from "./separator"

const meta = {
  title: "Primitives/Separator",
  component: Separator,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => <Separator className="w-48" />,
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-2">
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
  ),
}
