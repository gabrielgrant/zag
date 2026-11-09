import { component$, useId, useSignal } from "@qwik.dev/core"
import * as menu from "@zag-js/menu"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

export default component$(() => {
  const open = useSignal(false)
  const id = useId()

  const service = useMachine(menu.machine, () => ({
    id,
    open: open.value,
    onOpenChange: (details: menu.OpenChangeDetails) => (open.value = details.open),
    onSelect: console.log,
  }))

  const api = menu.connect(service, normalizeProps)

  return (
    <>
      <main class="context-menu">
        <div {...api.getContextTriggerProps()}>Right Click here</div>
        {/* rendered inline: Qwik has no portal */}
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
