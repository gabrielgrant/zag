import { component$, useId } from "@qwik.dev/core"
import * as popover from "@zag-js/popover"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { usePresence } from "~/lib/dialog-presence"

export default component$(() => {
  const service = useMachine(popover.machine, {
    id: useId(),
    modal: false,
    // React portals the content to the body; here it renders inline (Qwik has
    // no portal), so the machine's tab-order logic must not assume a portal
    portalled: false,
  })

  const api = popover.connect(service, normalizeProps)
  const contentPresence = usePresence(() => api.getContentProps())

  return (
    <main class="popover">
      <div data-part="root">
        <button data-testid="button-before">Button :before</button>

        <button data-testid="popover-trigger" {...api.getTriggerProps()}>
          Click me
        </button>

        <div {...api.getPositionerProps()}>
          <div data-testid="popover-content" class="popover-content" {...contentPresence.props}>
            <a href="#" data-testid="focusable-link">
              Focusable Link
            </a>
            <input data-testid="input" placeholder="input" />
            <button data-testid="popover-close-button" {...api.getCloseTriggerProps()}>
              X
            </button>
          </div>
        </div>
      </div>
    </main>
  )
})
