import { component$, useId } from "@qwik.dev/core"
import * as menu from "@zag-js/menu"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

export default component$(() => {
  const service = useMachine(menu.machine, {
    id: useId(),
  })

  const api = menu.connect(service, normalizeProps)

  return (
    <>
      <main class="context-menu">
        <div {...api.getContextTriggerProps()}>Right Click here</div>
        <div {...api.getPositionerProps()}>
          <ul {...api.getContentProps()}>
            <li {...api.getItemProps({ value: "edit" })}>Edit</li>
            <li {...api.getItemProps({ value: "duplicate" })}>Duplicate</li>
            <li {...api.getItemProps({ value: "delete" })}>Delete</li>
            <li {...api.getItemProps({ value: "export" })}>Export...</li>
          </ul>
        </div>
      </main>

      <Toolbar controls={null}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
