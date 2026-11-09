import { component$, useSignal } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { usePresence } from "~/lib/dialog-presence"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: dialog.Api } = {}

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
  const backdropPresence = usePresence(() => api.getBackdropProps())
  const contentPresence = usePresence(() => api.getContentProps())
  apiRef.current = api

  return (
    <main>
      <button onClick$={() => (open.value = !open.value)}>Delayed open</button>
      <p>state - isOpen: {String(open.value)}</p>
      <p>machine - isOpen: {String(api.open)}</p>
      <div {...backdropPresence.props} />
      <div {...api.getPositionerProps()}>
        <div {...contentPresence.props}>
          <h2 {...api.getTitleProps()}>Edit profile</h2>
          <p {...api.getDescriptionProps()}>Make changes to your profile here. Click save when you are done.</p>
          <button
            onClick$={() => {
              setTimeout(() => {
                apiRef.current?.setOpen(false)
              }, 2000)
            }}
          >
            Delayed close
          </button>
          <button {...api.getCloseTriggerProps()}>Close</button>
        </div>
      </div>
    </main>
  )
})
