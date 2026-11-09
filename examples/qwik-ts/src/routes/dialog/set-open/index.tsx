import { component$, useId, useSignal } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import { normalizeProps, useMachine } from "@zag-js/qwik"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: dialog.Api } = {}

export default component$(() => {
  const id = useId()
  const log = useSignal<boolean[]>([])

  const service = useMachine(dialog.machine, () => ({
    id,
    onOpenChange(details: dialog.OpenChangeDetails) {
      log.value = [...log.value, details.open]
    },
  }))

  const api = dialog.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <main>
      <div data-testid="open-state">{String(api.open)}</div>
      <div data-testid="open-change-log">{log.value.join(",")}</div>

      <button data-testid="reset" onClick$={() => (log.value = [])}>
        Reset log
      </button>

      <button data-testid="set-open" onClick$={() => apiRef.current?.setOpen(true)}>
        setOpen(true)
      </button>

      <button data-testid="set-closed" onClick$={() => apiRef.current?.setOpen(false)}>
        setOpen(false)
      </button>

      <button
        data-testid="open-then-close"
        onClick$={() => {
          apiRef.current?.setOpen(true)
          apiRef.current?.setOpen(false)
        }}
      >
        setOpen(true) then setOpen(false)
      </button>

      <button
        data-testid="close-then-open"
        onClick$={() => {
          apiRef.current?.setOpen(false)
          apiRef.current?.setOpen(true)
        }}
      >
        setOpen(false) then setOpen(true)
      </button>

      <button
        data-testid="open-repeatedly"
        onClick$={() => {
          for (let i = 0; i < 5; i++) apiRef.current?.setOpen(true)
        }}
      >
        setOpen(true) five times
      </button>

      {api.open && (
        <>
          <div {...api.getBackdropProps()} />
          <div {...api.getPositionerProps()}>
            <div {...api.getContentProps()}>
              <h2 {...api.getTitleProps()}>Imperative control</h2>
              <p {...api.getDescriptionProps()}>Opened and closed through api.setOpen.</p>
              <button data-testid="content-set-closed" onClick$={() => apiRef.current?.setOpen(false)}>
                setOpen(false)
              </button>
              <button {...api.getCloseTriggerProps()}>Close</button>
            </div>
          </div>
        </>
      )}
    </main>
  )
})
