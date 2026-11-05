import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "./button"

const meta = {
  title: "Primitives/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: [
        "default",
        "xs",
        "sm",
        "lg",
        "icon",
        "icon-xs",
        "icon-sm",
        "icon-lg",
      ],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { children: "Button" } }

export const Outline: Story = {
  args: { children: "Outline", variant: "outline" },
}

export const Secondary: Story = {
  args: { children: "Secondary", variant: "secondary" },
}

export const Ghost: Story = {
  args: { children: "Ghost", variant: "ghost" },
}

export const Destructive: Story = {
  args: { children: "Destructive", variant: "destructive" },
}

export const Link: Story = {
  args: { children: "Link", variant: "link" },
}

export const Disabled: Story = {
  args: { children: "Disabled", disabled: true },
}
