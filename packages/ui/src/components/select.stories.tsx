import type { Meta, StoryObj } from "@storybook/react"

import { Select } from "./select"

const meta = {
  title: "Primitives/Select",
  component: Select,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-64">{Story()}</div>],
  args: {
    defaultValue: "todo",
    "aria-label": "Status",
    children: (
      <>
        <option value="todo">Todo</option>
        <option value="in-progress">In progress</option>
        <option value="done">Done</option>
      </>
    ),
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Disabled: Story = {
  args: { disabled: true },
}
