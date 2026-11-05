import type { Meta, StoryObj } from "@storybook/react"

import { Input, Textarea } from "./input"

const meta = {
  title: "Primitives/Input",
  component: Input,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { placeholder: "you@example.com", type: "email" },
  decorators: [(Story) => <div className="w-72">{Story()}</div>],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithValue: Story = {
  args: { defaultValue: "paul@example.com" },
}

export const Disabled: Story = {
  args: { disabled: true, placeholder: "Disabled input" },
}

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "not-an-email" },
}

export const TextareaExample: StoryObj<typeof Textarea> = {
  render: () => <Textarea rows={3} placeholder="Add a description…" />,
}
