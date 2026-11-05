/**
 * Shared constants for the sidebar primitive. Kept in a neutral module (no
 * "use client") so both the client sidebar and the server dashboard layout can
 * import the cookie name without pulling each other across the RSC boundary.
 */
export const SIDEBAR_COOKIE_NAME = "sidebar_state"
