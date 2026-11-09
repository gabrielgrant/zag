/**
 * zag's event handlers are written against React's `send`, which is deferred:
 * code after a `send` in the same handler still sees the state from before it
 * (e.g. combobox's Enter handler sends INPUT.ENTER, then decides whether to
 * `preventDefault` the form submit from the not-yet-updated state).
 *
 * The Qwik adapter processes sends synchronously so state reaches Qwik's
 * scheduler within the event and conditional `preventDefault` keeps working.
 * To keep both, sends made while a zag handler runs are queued and processed,
 * in order, as soon as the outermost handler returns — still inside the same
 * event dispatch.
 */
let depth = 0
let flushing = false
const queue: VoidFunction[] = []

export function runHandler<T>(fn: () => T): T {
  depth++
  try {
    return fn()
  } finally {
    depth--
    if (depth === 0) flush()
  }
}

function flush() {
  // a send being processed can move focus and run another handler; its sends
  // join this queue and are processed after the current one, in order
  if (flushing) return
  flushing = true
  let error: unknown
  let failed = false
  while (queue.length) {
    const next = queue.shift()!
    try {
      next()
    } catch (e) {
      if (!failed) {
        failed = true
        error = e
      }
    }
  }
  flushing = false
  if (failed) throw error
}

/** Queues `fn` if a zag handler is running; returns whether it was queued */
export function deferWhileHandling(fn: VoidFunction): boolean {
  if (depth === 0) return false
  queue.push(fn)
  return true
}
