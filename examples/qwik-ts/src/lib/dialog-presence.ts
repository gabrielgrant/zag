import { isServer } from "@qwik.dev/core"
import * as presence from "@zag-js/presence"
import { normalizeProps, useMachine } from "@zag-js/qwik"

export interface UsePresenceOptions {
  /**
   * Whether to enable lazy mounting.
   */
  lazyMount?: boolean
  /**
   * Whether to skip the initial mount animation.
   */
  skipAnimationOnMount?: boolean
  /**
   * Whether to unmount the component when it's not present.
   */
  unmountOnExit?: boolean
}

/**
 * Qwik port of the examples' `<Presence>` helper (next-ts/components/presence.tsx):
 * keeps a part mounted and visible while its exit animation runs, then applies
 * `hidden`. The part's own `hidden` (from the zag prop getter) is the "present" input.
 *
 * It is a hook rather than a component: the part props carry the machine's event
 * handlers, which are plain functions on the client and must not cross a
 * `component$` boundary. Call it unconditionally in the component that renders
 * the part, and spread `props` onto the element:
 *
 * ```tsx
 * const content = usePresence(() => api.getContentProps())
 * <div class={styles.content} {...content.props}>...</div>
 * ```
 */
export function usePresence<T extends object>(getPartProps: () => T, options: UsePresenceOptions = {}) {
  const { lazyMount, skipAnimationOnMount, unmountOnExit } = options

  const partProps = getPartProps()
  const present = !(partProps as { hidden?: unknown }).hidden

  const service = useMachine(presence.machine, () => ({ present: !(getPartProps() as { hidden?: unknown }).hidden }))
  const api = presence.connect(service, normalizeProps)

  // React tracks this with state + effect; `initial` flips on the first change of
  // `present` (which starts out false for these parts), so it reads the same
  const wasEverPresent = api.present || service.context.get("initial")

  const unmounted = (!api.present && !wasEverPresent && lazyMount) || (unmountOnExit && !api.present && wasEverPresent)

  return {
    mounted: !unmounted,
    props: {
      "data-scope": "presence",
      "data-state": api.skip && skipAnimationOnMount ? undefined : present ? "open" : "closed",
      ...partProps,
      hidden: !api.present,
      // plain function ref: on the client Qwik calls it with the element on every
      // render (a new closure each time); during SSR it gets a DomRef
      ref: (node: Element) => {
        if (isServer || !(node instanceof HTMLElement)) return
        api.setNode(node)
      },
    },
  }
}
