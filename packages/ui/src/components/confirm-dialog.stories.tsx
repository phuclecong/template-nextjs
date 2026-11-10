import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "./button"
import { ConfirmDialog } from "./confirm-dialog"

function ConfirmDialogDemo({
  tone = "danger",
  loading = false,
}: {
  tone?: "danger" | "default"
  loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant={tone === "default" ? "default" : "destructive"}
        onClick={() => setOpen(true)}
      >
        Open confirm dialog
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete task"
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone={tone}
        loading={loading}
        onConfirm={() => setOpen(false)}
      />
    </>
  )
}

const meta = {
  title: "Primitives/ConfirmDialog",
  component: ConfirmDialog,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    open: false,
    onClose: () => {},
    title: "Delete task",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    onConfirm: () => {},
  },
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Danger: Story = {
  render: () => <ConfirmDialogDemo />,
}

export const Default: Story = {
  render: () => <ConfirmDialogDemo tone="default" />,
}

export const Loading: Story = {
  render: () => <ConfirmDialogDemo loading />,
}
