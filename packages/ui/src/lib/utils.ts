/**
 * Class-name utilities for the design system.
 *
 * `cn` is a drop-in replacement for `twMerge(clsx(...))` provided by the `cn`
 * package (compiled Tailwind class merging). Every primitive composes its
 * default tokens with caller-supplied `className` through `cn`, so callers can
 * override any token without specificity fights.
 */
export { cn, clsx, twJoin, twMerge } from "cn"
