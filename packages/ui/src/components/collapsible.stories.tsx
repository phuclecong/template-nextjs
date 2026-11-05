import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "./button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible"

const meta = {
  title: "Primitives/Collapsible",
  component: Collapsible,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Collapsible defaultOpen>
      <CollapsibleTrigger render={<Button variant="outline" />}>
        Toggle
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="mt-2 max-w-xs text-sm">
          Content that collapses and expands with the trigger.
        </p>
      </CollapsibleContent>
    </Collapsible>
  ),
}
