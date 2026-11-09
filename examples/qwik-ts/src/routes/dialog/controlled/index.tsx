import { component$, useSignal } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import { normalizeProps, useMachine } from "@zag-js/qwik"

export default component$(() => {
  const open = useSignal(false)

  const service = useMachine(dialog.machine, () => ({
    id: "1",
    open: open.value,
    onOpenChange(details: dialog.OpenChangeDetails) {
      open.value = details.open
    },
  }))
  const api = dialog.connect(service, normalizeProps)

  return (
    <div>
      <button onClick$={() => (open.value = !open.value)}>Open Dialog</button>
      <p>state - isOpen: {String(open.value)}</p>
      <p>machine - isOpen: {String(api.open)}</p>
      {api.open && (
        <>
          <div {...api.getBackdropProps()} />
          <div {...api.getPositionerProps()}>
            <div {...api.getContentProps()}>
              <h2 {...api.getTitleProps()}>Edit profile</h2>
              <p {...api.getDescriptionProps()}>Make changes to your profile here. Click save when you are done.</p>
              <div>
                <input placeholder="Enter name..." />
                <button>Save</button>
              </div>
              <button {...api.getCloseTriggerProps()}>Close</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
})
