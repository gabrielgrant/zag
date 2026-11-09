import { component$, useId, useSignal } from "@qwik.dev/core"
import * as menu from "@zag-js/menu"
import { normalizeProps, useMachine } from "@zag-js/qwik"

const MenuMultipleControlled = component$(() => {
  const open = useSignal(false)
  const id = useId()

  const service = useMachine(menu.machine, () => ({
    id,
    onOpenChange: (details: menu.OpenChangeDetails) => (open.value = details.open),
    open: open.value,
  }))

  const api = menu.connect(service, normalizeProps)

  return (
    <>
      <button {...api.getTriggerProps()}>Click me</button>
      {/* rendered inline: Qwik has no portal */}
      <div {...api.getPositionerProps()}>
        <div {...api.getContentProps()}>
          <li {...api.getItemProps({ value: "edit" })}>Edit</li>
          <li {...api.getItemProps({ value: "duplicate" })}>Duplicate</li>
          <li {...api.getItemProps({ value: "delete" })}>Delete</li>
          <li {...api.getItemProps({ value: "export" })}>Export...</li>
        </div>
      </div>
    </>
  )
})

export default component$(() => {
  return (
    <main>
      <div style={{ display: "flex", gap: "16px" }}>
        <MenuMultipleControlled />
        <MenuMultipleControlled />
      </div>
    </main>
  )
})
