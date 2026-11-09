import { component$, Slot, useSignal, useTask$ } from "@qwik.dev/core"
import { isServer } from "@qwik.dev/core/build"
import * as presence from "@zag-js/presence"
import { normalizeProps, useMachine } from "@zag-js/qwik"

interface PresenceProps {
  hidden?: boolean
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
  // remaining props are spread onto the div (attributes only: they cross a
  // `component$` boundary, so they must be serializable)
  [key: string]: unknown
}

/**
 * Port of the React example's `components/presence.tsx`: keeps the element
 * mounted while its exit animation runs.
 */
export const Presence = component$<PresenceProps>((props) => {
  const { hidden, lazyMount, skipAnimationOnMount, unmountOnExit, ...rest } = props

  const service = useMachine(presence.machine, () => ({ present: !props.hidden }))
  const api = presence.connect(service, normalizeProps)

  const wasEverPresent = useSignal(false)
  useTask$(({ track }) => {
    if (!track(() => props.hidden)) wasEverPresent.value = true
  })

  const present = !hidden
  const unmounted =
    (!api.present && !wasEverPresent.value && lazyMount) || (unmountOnExit && !api.present && wasEverPresent.value)

  if (unmounted) return null

  return (
    <div
      // the node is only needed on the client (animation tracking)
      ref={isServer ? undefined : (node: Element) => api.setNode(node as HTMLElement)}
      data-scope="presence"
      data-state={api.skip && skipAnimationOnMount ? undefined : present ? "open" : "closed"}
      hidden={!api.present}
      {...rest}
    >
      <Slot />
    </div>
  )
})
