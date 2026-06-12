/**
 * These are exported from `@qwik.dev/core` at runtime but omitted from its
 * curated public type surface. `_waitUntilRendered` resolves the container's
 * render promise (used only inside the wake QRL — never exposed to users).
 */
// @ts-expect-error -- runtime exports without public type declarations
import { getDomContainer, _waitUntilRendered } from "@qwik.dev/core"

export const getContainer = getDomContainer as (element: Element) => unknown
export const waitUntilRendered = _waitUntilRendered as (container: unknown) => Promise<void>
