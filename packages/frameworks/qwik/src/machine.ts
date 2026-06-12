import type {
  ActionsOrFn,
  BindableContext,
  BindableFn,
  BindableParams,
  BindableRefs,
  ChooseFn,
  ComputedFn,
  EffectsOrFn,
  GuardFn,
  Machine,
  MachineSchema,
  Params,
  Service,
} from "@zag-js/core"
import {
  createScope,
  findTransition,
  getExitEnterStates,
  hasTag,
  INIT_STATE,
  MachineStatus,
  matchesState,
  resolveStateValue,
} from "@zag-js/core"
import { callAll, compact, ensure, isEqual, isFunction, isString, toArray, warn } from "@zag-js/utils"
import { $, type NoSerialize, noSerialize, untrack, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import { isServer } from "@qwik.dev/core/build"
import { useBindable } from "./bindable"
import { getContainer, waitUntilRendered } from "./qwik-internal"
import { createRefs } from "./refs"
import { setWakeHandler } from "./wake-context"

type AnyFunction = () => string | number | boolean | null | undefined

/**
 * Zag machines do post-render DOM work (focus management, element measurement,
 * `checkRenderedElements`) inside `requestAnimationFrame`, assuming the
 * framework has committed the current render by the next frame — which React
 * guarantees via `flushSync`. Qwik commits on its own async scheduler, so a
 * machine's rAF can fire ~1 frame before the DOM reflects the latest state
 * (e.g. focusing dialog content while it still has `hidden`).
 *
 * Qwik does NOT use rAF to render (verified: rendering proceeds with rAF
 * stubbed out), so it is safe to gate rAF callbacks behind the container's
 * pending render. We patch the global once and defer a callback ONLY while a
 * render is actually in flight (`$renderPromise$` set) — otherwise it runs
 * inline, adding zero overhead to the common case.
 */
let rafGateInstalled = false
function installRafRenderGate() {
  if (rafGateInstalled || isServer) return
  const g = globalThis as any
  if (typeof g.requestAnimationFrame !== "function" || !g.document) return
  rafGateInstalled = true

  const orig = g.requestAnimationFrame.bind(g)
  let container: any
  const resolveContainer = () => {
    if (container) return container
    const el = g.document.querySelector("[q\\:container]")
    if (el) container = getContainer(el)
    return container
  }

  g.requestAnimationFrame = (cb: FrameRequestCallback): number =>
    orig((time: number) => {
      const c = resolveContainer()
      if (!c) return cb(time)
      // wait out any render in flight before running the machine's DOM work;
      // resolves on the next microtask when nothing is pending
      Promise.resolve(waitUntilRendered(c)).then(() => cb(time))
    })
}

/**
 * Everything the machine needs that is NOT Qwik-serializable.
 *
 * Held in a `NoSerialize` signal: it persists across client re-renders, is
 * dropped on SSR serialization, and is lazily rebuilt the first time the
 * component body executes on the client. All *data* state (machine state,
 * context values) lives in plain signals (see `useBindable`) and survives
 * SSR -> resume natively.
 */
interface MachineInternals {
  effects: Map<string, VoidFunction>
  transitionRef: { current: any }
  previousEventRef: { current: any }
  eventRef: { current: any }
  status: MachineStatus
  startScheduled: boolean
  propsRef: { current: any }
  scopeRef: { current: any }
  contextRef: { current: any }
  refs: BindableRefs<any> | undefined
  trackSlots: Array<any[]>
  trackIndex: number
  refSlots: Array<{ current: any }>
  refSlotIndex: number
  cleanupSlots: Array<VoidFunction>
  cleanupIndex: number
  postRenderQueue: Array<VoidFunction>
  pendingEvents: Array<any>
  processing: boolean
  sendQueue: Array<any>
  start: VoidFunction
  stop: VoidFunction
  flushPostRender: VoidFunction
}

function createInternals(): MachineInternals {
  return {
    effects: new Map(),
    transitionRef: { current: null },
    previousEventRef: { current: null },
    eventRef: { current: { type: "" } },
    status: MachineStatus.NotStarted,
    startScheduled: false,
    propsRef: { current: null },
    scopeRef: { current: null },
    contextRef: { current: null },
    refs: undefined,
    trackSlots: [],
    trackIndex: 0,
    refSlots: [],
    refSlotIndex: 0,
    cleanupSlots: [],
    cleanupIndex: 0,
    postRenderQueue: [],
    pendingEvents: [],
    processing: false,
    sendQueue: [],
    start: () => {},
    stop: () => {},
    flushPostRender: () => {},
  }
}

function access<T>(userProps: T | (() => T)): T {
  if (isFunction(userProps)) return userProps()
  return userProps
}

export function useMachine<T extends MachineSchema>(
  machine: Machine<T>,
  userProps: Partial<T["props"]> | (() => Partial<T["props"]>) = {},
): Service<T> {
  /**
   * Persistent hooks. These (and the per-bindable signals created inside
   * `machine.context()` below) must run unconditionally and in the same order
   * on every execution so Qwik's sequential scope stays aligned across SSR,
   * resume and re-renders.
   */
  const internalsSig = useSignal<NoSerialize<MachineInternals>>()
  const activatedSig = useSignal(false)
  const tickSig = useSignal(0)

  // IMPORTANT: read unconditionally (also during SSR) so the component
  // subscribes to the activation signal — flipping it on the client is what
  // re-executes this body after resume and attaches live event handlers.
  void activatedSig.value

  /**
   * Interaction wake. During SSR this QRL is serialized as the handler for
   * every zag event prop (see normalize-props), so qwikloader announces the
   * event types and captures interactions that happen before the eager
   * document-ready wake has completed. On invocation it activates the
   * component, waits for the activation render to commit, starts the machine,
   * and replays the captured event into the live handler that the render
   * registered. Same-turn `preventDefault()` is not possible for this very
   * first pre-wake event — the QRL chunk loads asynchronously (documented
   * limitation; equivalent to interacting mid-hydration in other frameworks).
   *
   * NOTE: like the tasks below, this closure may only capture serializable
   * values — signals only.
   */
  const wake$ = $(async (event: Event, element: Element) => {
    if (!activatedSig.value) activatedSig.value = true
    const container = getContainer(element)
    const scopedName = `e:${event.type}`
    for (let attempt = 0; attempt < 20; attempt++) {
      await waitUntilRendered(container)
      const current = internalsSig.value
      if (current) {
        current.start()
        const dispatch = (element as any)._qDispatch?.[scopedName]
        if (dispatch) {
          if (typeof dispatch === "function") return dispatch(event, element)
          for (const handler of dispatch) handler?.(event, element)
          return
        }
      }
      // the activation render may not have been scheduled yet when the
      // render promise was awaited — yield a macrotask and re-await
      await new Promise((resolve) => setTimeout(resolve))
    }
  })
  if (isServer) setWakeHandler(wake$)

  if (!isServer) installRafRenderGate()

  let internals = untrack(() => internalsSig.value) as MachineInternals | undefined
  if (!internals) {
    internals = createInternals()
    if (!isServer) {
      untrack(() => {
        internalsSig.value = noSerialize(internals)
      })
    }
  }
  // reset per-render slot cursors
  internals.trackIndex = 0
  internals.refSlotIndex = 0
  internals.cleanupIndex = 0

  const self = internals

  const debug = (...args: any[]) => {
    if (machine.debug) console.log(...args)
  }

  const { id, ids, getRootNode } = access(userProps) as any
  const scope = createScope({ id, ids, getRootNode })
  const computeProps = () => machine.props?.({ props: compact(access(userProps)), scope }) ?? access(userProps)

  self.propsRef.current = computeProps()
  self.scopeRef.current = scope

  const prop = ((key: any) => self.propsRef.current[key]) as Params<T>["prop"]

  const ctx: BindableContext<T> = {
    get(key) {
      return self.contextRef.current?.[key].get()
    },
    set(key, value) {
      self.contextRef.current?.[key].set(value)
    },
    initial(key) {
      return self.contextRef.current?.[key].initial
    },
    hash(key) {
      const current = self.contextRef.current?.[key].get()
      return self.contextRef.current?.[key].hash(current)
    },
  }

  const getEvent = () => ({
    ...self.eventRef.current,
    current() {
      return self.eventRef.current
    },
    previous() {
      return self.previousEventRef.current
    },
  })

  const getState = () => ({
    ...state,
    matches(...values: T["state"][]) {
      return values.some((value) => matchesState(state.get() as string, value as string))
    },
    hasTag(tag: T["tag"]) {
      return hasTag(machine, state.get(), tag)
    },
  })

  const flush = (fn: VoidFunction) => fn()

  /**
   * `track` is render-phase only (used by `machine.watch`): it diffs deps
   * against slot storage and defers changed callbacks until after Qwik has
   * committed the DOM (via the tick task below).
   */
  const track = (deps: AnyFunction[], fn: VoidFunction) => {
    const index = self.trackIndex++
    const next = deps.map((d) => d())
    const prev = self.trackSlots[index]
    self.trackSlots[index] = next
    // first run for this slot: initialize only
    if (prev === undefined) return
    let changed = false
    for (let i = 0; i < deps.length; i++) {
      if (!isEqual(prev[i], next[i])) {
        changed = true
        break
      }
    }
    if (changed) {
      self.postRenderQueue.push(fn)
      tickSig.value++
    }
  }

  const bindable: BindableFn = Object.assign(
    function bindableFn<K>(params: () => BindableParams<K>) {
      return useBindable(params)
    },
    {
      cleanup: (fn: VoidFunction) => {
        const index = self.cleanupIndex++
        // register once per slot; re-renders re-visit the same slot
        if (self.cleanupSlots[index] === undefined) self.cleanupSlots[index] = fn
      },
      ref: <V>(defaultValue: V) => {
        const index = self.refSlotIndex++
        let slot = self.refSlots[index]
        if (!slot) {
          slot = { current: defaultValue }
          self.refSlots[index] = slot
        }
        return {
          get: () => slot.current,
          set: (next: V) => {
            slot.current = next
          },
        }
      },
    },
  )

  const context: any = machine.context?.({
    prop,
    bindable,
    get scope() {
      return self.scopeRef.current
    },
    flush,
    getContext() {
      return ctx
    },
    getComputed() {
      return computed as any
    },
    getRefs() {
      return refs as any
    },
    getEvent() {
      return getEvent()
    },
  })
  self.contextRef.current = context

  const refs: BindableRefs<T> = (self.refs ??= createRefs(machine.refs?.({ prop, context: ctx }) ?? {}))

  const getParams = (): Params<T> => ({
    state: getState(),
    context: ctx,
    event: getEvent(),
    prop,
    send,
    action,
    guard,
    track,
    refs,
    computed,
    flush,
    scope: self.scopeRef.current,
    choose,
  })

  const action = (keys: ActionsOrFn<T> | undefined) => {
    const strs = isFunction(keys) ? keys(getParams()) : keys
    if (!strs) return
    const fns = strs.map((s) => {
      const fn = machine.implementations?.actions?.[s]
      if (!fn) warn(`[zag-js] No implementation found for action "${JSON.stringify(s)}"`)
      return fn
    })
    for (const fn of fns) {
      fn?.(getParams())
    }
  }

  const guard = (str: T["guard"] | GuardFn<T>) => {
    if (isFunction(str)) return str(getParams())
    return machine.implementations?.guards?.[str](getParams())
  }

  const effect = (keys: EffectsOrFn<T> | undefined) => {
    const strs = isFunction(keys) ? keys(getParams()) : keys
    if (!strs) return
    const fns = strs.map((s) => {
      const fn = machine.implementations?.effects?.[s]
      if (!fn) warn(`[zag-js] No implementation found for effect "${JSON.stringify(s)}"`)
      return fn
    })
    const cleanups: VoidFunction[] = []
    for (const fn of fns) {
      const cleanup = fn?.(getParams())
      if (cleanup) cleanups.push(cleanup)
    }
    return () => cleanups.forEach((fn) => fn?.())
  }

  const choose: ChooseFn<T> = (transitions) => {
    return toArray(transitions).find((t) => {
      let result = !t.guard
      if (isString(t.guard)) result = !!guard(t.guard)
      else if (isFunction(t.guard)) result = t.guard(getParams())
      return result
    })
  }

  const computed: ComputedFn<T> = (key) => {
    ensure(machine.computed, () => `[zag-js] No computed object found on machine`)
    const fn = machine.computed[key]
    return fn({
      context: ctx,
      event: getEvent(),
      prop,
      refs,
      scope: self.scopeRef.current,
      computed: computed as any,
    })
  }

  const state = useBindable(() => ({
    defaultValue: resolveStateValue(machine, machine.initialState({ prop })),
    onChange(nextState, prevState) {
      const { exiting, entering } = getExitEnterStates(
        machine,
        prevState,
        nextState,
        self.transitionRef.current?.reenter,
      )

      exiting.forEach((item) => {
        const exitEffects = self.effects.get(item.path)
        exitEffects?.()
        self.effects.delete(item.path)
      })

      exiting.forEach((item) => {
        action(item.state?.exit)
      })

      // transition actions
      action(self.transitionRef.current?.actions)

      entering.forEach((item) => {
        const cleanup = effect(item.state?.effects)
        if (cleanup) {
          // compose with any existing cleanup so re-entry of the same path
          // does not clobber a pending one
          const existing = self.effects.get(item.path)
          self.effects.set(item.path, existing ? callAll(existing, cleanup) : cleanup)
        }
      })

      // root entry actions
      if (prevState === INIT_STATE) {
        action(machine.entry)
        const cleanup = effect(machine.effects)
        if (cleanup) {
          const existing = self.effects.get(INIT_STATE)
          self.effects.set(INIT_STATE, existing ? callAll(existing, cleanup) : cleanup)
        }
      }

      entering.forEach((item) => {
        action(item.state?.entry)
      })
    },
  }))

  const processEvent = (event: any) => {
    if (self.status !== MachineStatus.Started) return

    // re-resolve props at the event boundary: Qwik commits renders on its
    // own scheduler, so an event can arrive before the render that follows
    // a userProps change (e.g. a controls-store update). When userProps is
    // a function, this reads the live values instead of the last render's
    // snapshot.
    self.propsRef.current = computeProps()

    self.previousEventRef.current = self.eventRef.current
    self.eventRef.current = event

    const currentState = state.get()

    const { transitions, source } = findTransition(machine, currentState, event.type as string)
    const transition = choose(transitions)
    if (!transition) return

    // save current transition
    self.transitionRef.current = transition
    const target = resolveStateValue(machine, transition.target ?? currentState, source)

    debug("transition", event.type, transition.target || currentState, `(${transition.actions})`)

    const changed = target !== currentState
    if (changed) {
      state.set(target)
    } else if (transition.reenter) {
      state.invoke(currentState, currentState)
    } else {
      action(transition.actions ?? [])
    }
  }

  const send = (event: any) => {
    if (self.status === MachineStatus.NotStarted && self.startScheduled) {
      // live handlers attach when the client render commits, but the machine
      // starts one task later — buffer events that land in that gap
      if (self.pendingEvents.length < 64) self.pendingEvents.push(event)
      return
    }

    // Process synchronously (so state changes reach Qwik's scheduler within
    // the event handler, and conditional `preventDefault` keeps working), but
    // serialize re-entrant sends: an action that moves DOM focus fires a
    // synchronous focusin whose handler calls send() again — running it inline
    // would overwrite `event`/transition mid-sequence and later actions in the
    // outer sequence would read the wrong event. Queue it and drain after.
    if (self.processing) {
      self.sendQueue.push(event)
      return
    }
    self.processing = true
    try {
      processEvent(event)
      while (self.sendQueue.length) {
        processEvent(self.sendQueue.shift())
      }
    } finally {
      self.processing = false
    }
  }

  // refresh lifecycle closures so they capture this render's bindables/params
  self.start = () => {
    if (self.status === MachineStatus.Started) return
    debug("initializing...")
    self.status = MachineStatus.Started
    state.invoke(state.get(), INIT_STATE)
    // replay events buffered between render commit and machine start
    const pending = self.pendingEvents.splice(0, self.pendingEvents.length)
    pending.forEach((event) => send(event))
  }
  self.stop = () => {
    debug("unmounting...")
    self.status = MachineStatus.Stopped
    self.effects.forEach((fn) => fn?.())
    self.effects.clear()
    self.transitionRef.current = null
    self.cleanupSlots.forEach((fn) => fn?.())
    action(machine.exit)
  }
  self.flushPostRender = () => {
    const queue = self.postRenderQueue.splice(0, self.postRenderQueue.length)
    queue.forEach((fn) => fn())
  }

  machine.watch?.(getParams())

  /**
   * Any client-side execution means a render is about to commit; the machine
   * start belongs after that commit (live handlers attached, DOM settled), so
   * it is deferred to the post-commit tick task below. `start` is idempotent —
   * the lifecycle task and the wake QRL may also call it.
   */
  if (!isServer && self.status === MachineStatus.NotStarted && !self.startScheduled) {
    self.startScheduled = true
    self.postRenderQueue.push(() => self.start())
    untrack(() => tickSig.value++)
  }

  /**
   * Lifecycle task — the eager client "wake".
   *
   * - CSR mount (e.g. SPA navigation): the body already executed and this task
   *   runs after the DOM is committed, so start the machine directly.
   * - Resumed SSR: the body has NOT executed on the client yet (the signal
   *   holding internals does not survive serialization), so flip the
   *   activation signal: the component re-renders, attaches live handlers,
   *   and schedules the machine start post-commit.
   *
   * NOTE: this closure (and the one below) may only capture serializable
   * values — signals only.
   */
  useVisibleTask$(
    ({ cleanup }) => {
      const current = internalsSig.value
      if (current) {
        current.start()
      } else if (!activatedSig.value) {
        activatedSig.value = true
      }
      cleanup(() => internalsSig.value?.stop())
    },
    { strategy: "document-ready" },
  )

  /**
   * Tick task — Qwik-native post-commit hook. Visible tasks run after the DOM
   * journal flush, so anything queued during render (machine start on resume,
   * `watch` effects) runs against the committed DOM.
   */
  useVisibleTask$(
    ({ track: qwikTrack }) => {
      qwikTrack(() => tickSig.value)
      internalsSig.value?.flushPostRender()
    },
    { strategy: "document-ready" },
  )

  return {
    get state() {
      return getState()
    },
    send,
    context: ctx,
    prop,
    get scope() {
      return self.scopeRef.current
    },
    refs,
    computed,
    get event() {
      return getEvent()
    },
    getStatus: () => self.status,
  } as Service<T>
}
