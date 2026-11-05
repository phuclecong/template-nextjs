import type { Meta, StoryObj } from "@storybook/react"

import { Field, Label } from "./form"
import { Input } from "./input"

const meta = {
  title: "Primitives/Form",
  component: Field,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: null },
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const FieldWithLabel: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <Field label="Email" htmlFor="story-email">
        <Input id="story-email" type="email" placeholder="you@example.com" />
      </Field>
      <Field
        label="Password"
        htmlFor="story-password"
        hint="At least 8 characters"
      >
        <Input id="story-password" type="password" />
      </Field>
      <Field
        label="Email"
        htmlFor="story-email-invalid"
        error="Enter a valid email"
      >
        <Input
          id="story-email-invalid"
          aria-invalid
          defaultValue="not-an-email"
        />
      </Field>
    </div>
  ),
}

export const LabelOnly: Story = {
  render: () => <Label htmlFor="story-input">A standalone label</Label>,
}
