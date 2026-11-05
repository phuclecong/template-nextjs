/**
 * Shared base tokens for the form-control primitives — `Input`, `Textarea`,
 * and `Select` all render the same chrome (border, background, padding, focus
 * ring, and invalid state). Each primitive layers its own additions on top
 * through `cn`.
 */
export const fieldBase =
  "w-full min-w-0 rounded-none border border-input bg-background px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50"
