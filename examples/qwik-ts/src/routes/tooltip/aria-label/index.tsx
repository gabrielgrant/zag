import { component$ } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as tooltip from "@zag-js/tooltip"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { usePresence } from "~/lib/menu-presence"

export default component$(() => {
  const id = "tip-1"
  const service = useMachine(tooltip.machine, { id, "aria-label": "Save the document" })
  const api = tooltip.connect(service, normalizeProps)

  // React: <Presence {...api.getContentProps()}> — the content's `hidden` drives presence
  const contentProps = api.getContentProps()
  const presence = usePresence(() => ({ present: !contentProps.hidden }))

  return (
    <>
      <main class="tooltip">
        <div class="root">
          <button data-testid={`${id}-trigger`} {...api.getTriggerProps()}>
            Save
          </button>
          {/* rendered inline: Qwik has no portal */}
          <div {...api.getPositionerProps()}>
            <div class="tooltip-content" data-testid={`${id}-tooltip`} {...presence.getProps(contentProps)}>
              Save <kbd>⌘S</kbd>
            </div>
          </div>
        </div>
      </main>
      <Toolbar controls={null}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
