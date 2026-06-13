import { getContainer, waitUntilRendered } from "./qwik-internal"

/**
 * An event captured by the wake QRL before its component had woken on the
 * client, awaiting ordered replay into the live (post-wake) handler.
 */
interface ReplayItem {
  event: Event
  element: Element
  scopedName: string
  /** Activate the owning component (flip its activation signal). */
  activate: () => void
  /** Resolve the owning component's live internals once it has woken. */
  getInternals: () => { start: VoidFunction } | undefined
}

/**
 * Pre-wake events are dispatched by qwikloader through independent invocations
 * of the (single, serialized) wake QRL, so without coordination their replay
 * races: a keydown can reach the machine before the focus that must precede it,
 * and transitions only valid from the post-focus state are silently dropped
 * (e.g. select arrow-to-open requires the `focused` state).
 *
 * A second race is the "overtake": once the eager document-ready wake completes
 * mid-sequence, a later event hits a now-live handler and runs inline, jumping
 * ahead of an earlier event still queued for replay.
 *
 * Both are closed by funnelling everything through one strict FIFO drain — each
 * task fully completes before the next begins. The wake QRL enqueues captured
 * events (`enqueueReplay`); live handlers yield to the queue while it is
 * draining (`isReplayDraining` + `enqueueDeferred`) so DOM order is preserved.
 */
type Task = () => Promise<void> | void

const queue: Task[] = []
let draining = false

function enqueue(task: Task) {
  queue.push(task)
  if (!draining) {
    draining = true
    void drain()
  }
}

async function drain() {
  while (queue.length) {
    try {
      await queue[0]()
    } finally {
      queue.shift()
    }
  }
  draining = false
}

export function isReplayDraining() {
  return draining
}

/** Queue a captured pre-wake event for ordered replay into its live handler. */
export function enqueueReplay(item: ReplayItem) {
  enqueue(() => replayOne(item))
}

/** Queue a live (post-wake) handler invocation behind any pending replays. */
export function enqueueDeferred(fn: () => void) {
  enqueue(fn)
}

async function replayOne(item: ReplayItem) {
  item.activate()
  const container = getContainer(item.element)
  for (let attempt = 0; attempt < 20; attempt++) {
    await waitUntilRendered(container)
    const internals = item.getInternals()
    if (internals) {
      internals.start()
      const dispatch = (item.element as any)._qDispatch?.[item.scopedName]
      if (dispatch) {
        if (typeof dispatch === "function") {
          dispatch(item.event, item.element)
        } else {
          for (const handler of dispatch) handler?.(item.event, item.element)
        }
        return
      }
    }
    // the activation render may not have been scheduled yet when the render
    // promise was awaited — yield a macrotask and re-await
    await new Promise((resolve) => setTimeout(resolve))
  }
}
