import { component$, useVisibleTask$ } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import { normalizeProps, useMachine } from "@zag-js/qwik"

export default component$(() => {
  const service = useMachine(dialog.machine, { id: "1" })
  const api = dialog.connect(service, normalizeProps)

  // Make <html> establish its own scroll container, like an app-shell layout that scrolls the
  // viewport itself rather than relying on <body>'s default overflow propagation.
  useVisibleTask$(
    ({ cleanup }) => {
      document.documentElement.style.overflowY = "auto"
      cleanup(() => {
        document.documentElement.style.removeProperty("overflow-y")
      })
    },
    { strategy: "document-ready" },
  )

  // Qwik has no portal: the dialog and the tall content render inline
  return (
    <main>
      <p>The dialog's scroll lock should apply to &lt;html&gt;, not &lt;body&gt;, on this page.</p>

      <button {...api.getTriggerProps()} data-testid="dialog-trigger">
        Open Dialog
      </button>

      {api.open && (
        <>
          <div {...api.getBackdropProps()} />
          <div {...api.getPositionerProps()}>
            <div {...api.getContentProps()}>
              <h2 {...api.getTitleProps()}>Dialog</h2>
              <p {...api.getDescriptionProps()}>Dialog content</p>
              <button {...api.getCloseTriggerProps()} data-testid="dialog-close">
                Close
              </button>
            </div>
          </div>
        </>
      )}

      <div data-testid="tall-content" style={{ height: "4000px" }} />
    </main>
  )
})
