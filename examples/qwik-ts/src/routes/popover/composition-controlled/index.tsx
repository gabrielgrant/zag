import { component$, useId, useSignal } from "@qwik.dev/core"
import * as popover from "@zag-js/popover"
import { normalizeProps, useMachine } from "@zag-js/qwik"

const Popover = component$(() => {
  const id = useId()
  const open = useSignal(false)

  const service = useMachine(popover.machine, () => ({
    id,
    onOpenChange: (details: popover.OpenChangeDetails) => {
      open.value = details.open
    },
    open: open.value,
    // React portals the content when `portalled`; here it renders inline (Qwik has no portal)
    portalled: false,
  }))

  const api = popover.connect(service, normalizeProps)

  return (
    <main>
      <button {...api.getTriggerProps()}>Click me</button>
      <div {...api.getPositionerProps()}>
        <div {...api.getContentProps()}>
          <div {...api.getTitleProps()}>Presenters</div>
          <div {...api.getDescriptionProps()}>Description</div>
          <button>Action Button</button>
          <button {...api.getCloseTriggerProps()}>X</button>
        </div>
      </div>
    </main>
  )
})

export default component$(() => {
  return (
    <div class="App">
      <Popover />
    </div>
  )
})
