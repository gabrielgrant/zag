import { component$, useId } from "@qwik.dev/core"
import * as menu from "@zag-js/menu"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { menuControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"
import { usePresence } from "~/lib/menu-presence"

export default component$(() => {
  const controls = useControls(menuControls)
  const id = useId()

  const service = useMachine(
    menu.machine,
    () =>
      ({
        id,
        onSelect: console.log,
        ...controls.values(),
      }) as menu.Props,
  )

  const api = menu.connect(service, normalizeProps)

  // React: <Presence hidden={!api.open} lazyMount unmountOnExit>
  const presence = usePresence(() => ({ present: api.open, lazyMount: true, unmountOnExit: true }))

  return (
    <>
      <main>
        <div>
          <button {...api.getTriggerProps()}>
            Actions <span {...api.getIndicatorProps()}>▾</span>
          </button>
          {!presence.unmounted && (
            <div {...presence.getProps()}>
              <div {...api.getPositionerProps()}>
                <ul {...api.getContentProps()}>
                  <li {...api.getItemProps({ value: "edit" })}>Edit</li>
                  <li {...api.getItemProps({ value: "duplicate" })}>Duplicate</li>
                  <li {...api.getItemProps({ value: "delete" })}>Delete</li>
                  <li {...api.getItemProps({ value: "export" })}>Export...</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
