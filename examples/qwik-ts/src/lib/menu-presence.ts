import { useSignal } from "@qwik.dev/core"
import { isServer } from "@qwik.dev/core/build"
import * as presence from "@zag-js/presence"
import { normalizeProps, useMachine } from "@zag-js/qwik"

/**
 * Qwik counterpart of the React example's `<Presence>` component.
 *
 * It is a hook rather than a component: the element it controls usually also
 * carries zag prop getters (event handlers), which cannot cross a `component$`
 * boundary, and an inline component cannot own hooks. Call it unconditionally
 * in the route body and spread `getProps()` onto the element.
 *
 * Shared by the menu, tooltip and navigation-menu examples (named `menu-*`
 * only because of the per-component file naming rule).
 */
export interface PresenceOptions {
  /** whether the element should be present */
  present: boolean
  /** do not mount until the first time it is present */
  lazyMount?: boolean
  /** unmount after the exit animation completes */
  unmountOnExit?: boolean
  /** skip the initial mount animation */
  skipAnimationOnMount?: boolean
}

export interface UsePresenceReturn {
  /** whether the element should not be rendered at all */
  unmounted: boolean
  /**
   * The element's props, like React's `<Presence {...props}>`: presence's own
   * `data-scope`/`data-state` (overridden by `props`), then `props` minus
   * `hidden`, then presence's `hidden` and the ref.
   *
   * NOTE: spread this (a call) rather than writing `hidden={presence.x}`: the
   * Qwik optimizer turns an attribute that reads a member of a non-signal
   * object into a signal binding that keeps the first render's object and
   * never updates on re-render.
   */
  getProps: <T extends Record<string, any>>(props?: T) => Omit<T, "hidden"> & Record<string, any>
}

export function usePresence(options: () => PresenceOptions): UsePresenceReturn {
  const ref = useSignal<Element>()
  const wasEverPresent = useSignal(false)

  const service = useMachine(presence.machine, () => ({ present: options().present }))
  const api = presence.connect(service, normalizeProps)

  const { present, lazyMount, unmountOnExit, skipAnimationOnMount } = options()

  // mirrors the React effect `if (api.present) setWasEverPresent(true)`
  if (api.present && !wasEverPresent.value) wasEverPresent.value = true

  // the ref signal is filled once the element mounts; reading it here re-runs
  // the route then, and setNode ignores a node it already has
  const node = ref.value
  if (!isServer && node) api.setNode(node as HTMLElement)

  const unmounted =
    (!api.present && !wasEverPresent.value && !!lazyMount) || (!!unmountOnExit && !api.present && wasEverPresent.value)

  const state = api.skip && skipAnimationOnMount ? undefined : present ? "open" : "closed"

  return {
    unmounted,
    getProps(props) {
      const { hidden: _hidden, ...rest } = props ?? ({} as Record<string, any>)
      return { "data-scope": "presence", "data-state": state, ...rest, hidden: !api.present, ref } as any
    },
  }
}
