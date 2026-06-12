import type { QRL } from "@qwik.dev/core"

export type WakeHandler = QRL<(event: Event, element: Element) => any>

/**
 * During SSR, `useMachine` registers its wake QRL here so that
 * `normalizeProps` can emit it as the serialized handler for every zag event
 * prop. `useMachine` and the JSX consuming `connect()` run in the same
 * synchronous render frame, so a module-level slot is safe even with
 * interleaved streaming SSR requests.
 */
let currentWake: WakeHandler | null = null

export function setWakeHandler(wake: WakeHandler | null) {
  currentWake = wake
}

export function getWakeHandler(): WakeHandler | null {
  return currentWake
}
