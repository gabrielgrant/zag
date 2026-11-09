import { component$, useId, useSignal } from "@qwik.dev/core"
import * as popover from "@zag-js/popover"
import { normalizeProps, useMachine } from "@zag-js/qwik"

const PopoverControlled = component$(() => {
  const id = useId()
  const open = useSignal(false)

  const service = useMachine(popover.machine, () => ({
    id,
    onOpenChange: (details: popover.OpenChangeDetails) => {
      open.value = details.open
    },
    open: open.value,
    // React portals the content; here it renders inline (Qwik has no portal)
    portalled: false,
  }))

  const api = popover.connect(service, normalizeProps)

  return (
    <>
      <button {...api.getTriggerProps()}>Click me</button>
      <div {...api.getPositionerProps()}>
        <div {...api.getContentProps()}>
          <div {...api.getTitleProps()}>Presenters</div>
          <div {...api.getDescriptionProps()}>Description</div>
          <button onClick$={() => (open.value = false)}>Action Button</button>
        </div>
      </div>
    </>
  )
})

export default component$(() => {
  return (
    <main>
      <div style={{ display: "flex", gap: "16px" }}>
        <PopoverControlled />
        <PopoverControlled />
      </div>
    </main>
  )
})
