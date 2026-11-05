import type { Meta, StoryObj } from "@storybook/react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

const rows = [
  { id: "1", name: "Alice Admin", email: "alice@example.com", role: "admin" },
  { id: "2", name: "Bob Member", email: "bob@example.com", role: "member" },
  { id: "3", name: "Cara Member", email: "cara@example.com", role: "member" },
]

const meta = {
  title: "Primitives/Table",
  component: Table,
  tags: ["autodocs"],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="overflow-auto border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
}
