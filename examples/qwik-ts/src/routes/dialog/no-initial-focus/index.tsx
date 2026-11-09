import { component$, useId } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import { normalizeProps, useMachine } from "@zag-js/qwik"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: dialog.Api } = {}

export default component$(() => {
  const service = useMachine(dialog.machine, {
    id: useId(),
    // opt out of initial focus entirely: nobody clicked, so nothing should ring
    initialFocusEl: () => false,
  })
  const api = dialog.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <main>
      <input data-testid="outside-input" placeholder="Focus stays here" />
      <button data-testid="open-button" onClick$={() => apiRef.current?.setOpen(true)}>
        Open dialog programmatically
      </button>
      {api.open && (
        <>
          <div {...api.getBackdropProps()} />
          <div {...api.getPositionerProps()}>
            <div {...api.getContentProps()}>
              <button {...api.getCloseTriggerProps()}>Close</button>
              <h2 {...api.getTitleProps()}>Special offer</h2>
              <p {...api.getDescriptionProps()}>Opened without moving focus. Tab and Escape still work.</p>
              <input placeholder="Enter name..." />
              <button>Save</button>
            </div>
          </div>
        </>
      )}
    </main>
  )
})
