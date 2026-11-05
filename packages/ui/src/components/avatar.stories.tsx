import type { Meta, StoryObj } from "@storybook/react"

import { Avatar, AvatarFallback } from "./avatar"

const meta = {
  title: "Primitives/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>AU</AvatarFallback>
    </Avatar>
  ),
}
