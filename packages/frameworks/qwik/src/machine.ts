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
import { createScope, INIT_STATE, MachineStatus } from "@zag-js/core"
import { compact, ensure, isEqual, isFunction, isString, toArray, warn } from "@zag-js/utils"
import { $, type NoSerialize, noSerialize, untrack, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import { isServer } from "@qwik.dev/core/build"
import { useBindable } from "./bindable"
import { getContainer, waitUntilRendered } from "./qwik-internal"
import { createRefs } from "./refs"
import { setWakeHandler } from "./wake-context"

type AnyFunction = () => string | number | boolean | null | undefined

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
  const props: any = machine.props?.({ props: compact(access(userProps)), scope }) ?? access(userProps)

  self.propsRef.current = props
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
      return values.includes(state.get())
    },
    hasTag(tag: T["tag"]) {
      const currentState = state.get()
      return !!machine.states[currentState as T["state"]]?.tags?.includes(tag)
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
    defaultValue: machine.initialState({ prop }),
    onChange(nextState, prevState) {
      // compute effects: exit -> transition -> enter

      // exit effects
      if (prevState) {
        const exitEffects = self.effects.get(prevState)
        exitEffects?.()
        self.effects.delete(prevState)
      }

      // exit actions
      if (prevState) {
        action(machine.states[prevState]?.exit)
      }

      // transition actions
      action(self.transitionRef.current?.actions)

      // enter effect
      const cleanup = effect(machine.states[nextState]?.effects)
      if (cleanup) self.effects.set(nextState as string, cleanup)

      // root entry actions
      if (prevState === INIT_STATE) {
        action(machine.entry)
        const cleanup = effect(machine.effects)
        if (cleanup) self.effects.set(INIT_STATE, cleanup)
      }

      // enter actions
      action(machine.states[nextState]?.entry)
    },
  }))

  const send = (event: any) => {
    if (self.status === MachineStatus.NotStarted && self.startScheduled) {
      // live handlers attach when the client render commits, but the machine
      // starts one task later — buffer events that land in that gap
      if (self.pendingEvents.length < 64) self.pendingEvents.push(event)
      return
    }
    if (self.status !== MachineStatus.Started) return

    self.previousEventRef.current = self.eventRef.current
    self.eventRef.current = event

    const currentState = state.get()

    const transitions =
      // @ts-ignore
      machine.states[currentState].on?.[event.type] ??
      // @ts-ignore
      machine.on?.[event.type]

    const transition = choose(transitions)
    if (!transition) return

    // save current transition
    self.transitionRef.current = transition
    const target = transition.target ?? currentState

    debug("transition", event.type, transition.target || currentState, `(${transition.actions})`)

    const changed = target !== currentState
    if (changed) {
      state.set(target)
    } else if (transition.reenter && !changed) {
      state.invoke(currentState, currentState)
    } else {
      action(transition.actions)
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
