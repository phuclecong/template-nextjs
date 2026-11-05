import type { Meta, StoryObj } from "@storybook/react"

import { Field, FieldDescription, FieldError, FieldLabel } from "./field"
import { Input } from "./input"

const meta = {
  title: "Primitives/Field",
  component: Field,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="field-email">Email</FieldLabel>
        <Input id="field-email" type="email" placeholder="you@example.com" />
        <FieldDescription>We&apos;ll never share your email.</FieldDescription>
      </Field>
      <Field data-invalid>
        <FieldLabel htmlFor="field-email-invalid">Email</FieldLabel>
        <Input
          id="field-email-invalid"
          aria-invalid
          defaultValue="not-an-email"
        />
        <FieldError errors={[{ message: "Enter a valid email address." }]} />
      </Field>
    </div>
  ),
}
