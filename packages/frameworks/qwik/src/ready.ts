/**
 * Machines on a resumed page start in steps: a document-ready task activates
 * the component, the activation render attaches live handlers, and the
 * machine starts after that render commits. Until then, interactions go
 * through the wake QRL and are replayed, and the replay cannot cancel a
 * browser default action in the same turn (e.g. the `click` that Enter fires
 * on a button). This counts wakes in flight so callers such as end-to-end
 * tests can wait until every machine that has begun waking has started.
 */
let pending = 0
let waiters: VoidFunction[] = []

export function beginWake() {
  pending++
}

export function endWake() {
  if (pending === 0) return
  pending--
  if (pending === 0) {
    const resolved = waiters
    waiters = []
    resolved.forEach((resolve) => resolve())
  }
}

/**
 * Resolves once every machine that has begun waking in this document has
 * started. Call it from a document-ready visible task: it first yields a
 * macrotask so the wake tasks dispatched alongside the caller can begin.
 */
export async function whenMachinesStarted(): Promise<void> {
  do {
    await new Promise((resolve) => setTimeout(resolve))
    if (pending) await new Promise<void>((resolve) => waiters.push(resolve))
  } while (pending)
}
