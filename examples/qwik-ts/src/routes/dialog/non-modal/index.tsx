import { component$, useId } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import { normalizeProps, useMachine } from "@zag-js/qwik"

export default component$(() => {
  const service = useMachine(dialog.machine, { id: useId(), modal: false, closeOnInteractOutside: true })
  const api = dialog.connect(service, normalizeProps)

  return (
    <main>
      <button data-testid="trigger-1" {...api.getTriggerProps()}>
        Open Dialog
      </button>
      <input data-testid="outside-input" placeholder="Outside input" />
      <p data-testid="outside-content">The page stays interactive while the dialog is open.</p>
      {api.open && (
        <div data-testid="positioner-1" {...api.getPositionerProps()}>
          <div {...api.getContentProps()}>
            <h2 {...api.getTitleProps()}>Non-modal dialog</h2>
            <p {...api.getDescriptionProps()}>No backdrop and no focus trap.</p>
            <input placeholder="Enter name..." />
            <button data-testid="close-1" {...api.getCloseTriggerProps()}>
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  )
})
