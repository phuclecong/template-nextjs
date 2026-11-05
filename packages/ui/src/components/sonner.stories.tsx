import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "./button"
import { Toaster, toast } from "./sonner"

function ToastDemo() {
  return (
    <>
      <Toaster position="bottom-right" richColors />
      <div className="flex gap-2">
        <Button
          onClick={() =>
            toast.success("Saved", { description: "Your changes are live." })
          }
        >
          Success toast
        </Button>
        <Button
          variant="destructive"
          onClick={() =>
            toast.error("Failed", {
              description: "Could not save your changes.",
            })
          }
        >
          Error toast
        </Button>
      </div>
    </>
  )
}

const meta = {
  title: "Primitives/Toast",
  component: Toaster,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <ToastDemo />,
}
