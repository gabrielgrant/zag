import { component$, useId, useSignal, useTask$ } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import * as popover from "@zag-js/popover"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { usePresence } from "~/lib/dialog-presence"

const ToggleTip = component$(() => {
  const id = useId()
  const open = useSignal(false)

  useTask$(({ track, cleanup }) => {
    if (!track(open)) return
    const timer = setTimeout(() => (open.value = false), 2000)
    cleanup(() => clearTimeout(timer))
  })

  const service = useMachine(popover.machine, () => ({
    id,
    // React portals the content to the body; here it renders inline (Qwik has no portal)
    portalled: false,
    open: open.value,
    onOpenChange(details: popover.OpenChangeDetails) {
      open.value = details.open
    },
    closeOnInteractOutside: false,
    restoreFocus: false,
  }))

  const api = popover.connect(service, normalizeProps)
  const contentPresence = usePresence(() => api.getContentProps())

  return (
    <div style={{ display: "inline-block" }}>
      <button data-testid="toggletip-trigger" {...api.getTriggerProps()}>
        ℹ Info
      </button>
      <div {...api.getPositionerProps()}>
        <div data-testid="toggletip-content" class="popover-content" {...contentPresence.props}>
          <div {...api.getArrowProps()}>
            <div {...api.getArrowTipProps()} />
          </div>
          <div {...api.getTitleProps()}>Toggle Tip</div>
          <div data-part="body">This is some additional information. It will close in 2 seconds.</div>
        </div>
      </div>
    </div>
  )
})

export default component$(() => {
  const service = useMachine(dialog.machine, {
    id: useId(),
    // Prevent the dialog from closing when a sibling layer (toggle-tip) is removed
    onRequestDismiss(event) {
      event.preventDefault()
    },
  })
  const api = dialog.connect(service, normalizeProps)

  return (
    <main>
      <div style={{ padding: "20px", display: "flex", flexDirection: "row", gap: "12px", alignItems: "center" }}>
        <ToggleTip />
        <button data-testid="dialog-trigger" {...api.getTriggerProps()}>
          Open Dialog
        </button>
      </div>

      {api.open && (
        <>
          <div {...api.getBackdropProps()} />
          <div {...api.getPositionerProps()}>
            <div {...api.getContentProps()}>
              <h2 {...api.getTitleProps()}>Dialog Title</h2>
              <div {...api.getDescriptionProps()}>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua.
                </p>
              </div>
              <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button {...api.getCloseTriggerProps()} data-testid="dialog-close">
                  Cancel
                </button>
                <button data-testid="dialog-save">Save</button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  )
})
