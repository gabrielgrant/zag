import { component$ } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { tooltipControls } from "@zag-js/shared"
import * as tooltip from "@zag-js/tooltip"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"
import { usePresence } from "~/lib/menu-presence"

export default component$(() => {
  const id = "tip-1"
  const controls = useControls(tooltipControls)
  const service = useMachine(tooltip.machine, () => ({ id, ...controls.values() }))
  const api = tooltip.connect(service, normalizeProps)

  // React: <Presence {...api.getContentProps()}> — the content's `hidden` drives presence
  const contentProps = api.getContentProps()
  const presence = usePresence(() => ({ present: !contentProps.hidden }))

  return (
    <>
      <main class="tooltip">
        <div class="root">
          <button data-testid={`${id}-trigger`} {...api.getTriggerProps()}>
            Hover me
          </button>
          {/* rendered inline: Qwik has no portal */}
          <div {...api.getPositionerProps()}>
            <div class="tooltip-content" data-testid={`${id}-tooltip`} {...presence.getProps(contentProps)}>
              Tooltip
            </div>
          </div>
        </div>
      </main>
      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
