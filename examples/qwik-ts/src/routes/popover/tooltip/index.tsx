import { component$, useId } from "@qwik.dev/core"
import * as popover from "@zag-js/popover"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import * as tooltip from "@zag-js/tooltip"

export default component$(() => {
  const ids = { trigger: useId() }

  const popoverService = useMachine(popover.machine, {
    id: useId(),
    ids,
    // React portals the content to the body; here it renders inline (Qwik has no portal)
    portalled: false,
  })

  const tooltipService = useMachine(tooltip.machine, {
    id: useId(),
    ids,
    positioning: { placement: "top" },
  })

  const popoverApi = popover.connect(popoverService, normalizeProps)
  const tooltipApi = tooltip.connect(tooltipService, normalizeProps)

  return (
    <main class="popover">
      <div data-part="root">
        <button {...mergeProps(popoverApi.getTriggerProps(), tooltipApi.getTriggerProps())}>Click me</button>

        {tooltipApi.open && (
          <div {...tooltipApi.getPositionerProps()}>
            <div class="tooltip-content" {...tooltipApi.getContentProps()}>
              Tooltip
            </div>
          </div>
        )}

        <div {...popoverApi.getPositionerProps()}>
          <div {...popoverApi.getContentProps()}>
            <div {...popoverApi.getTitleProps()}>Popover Title</div>
            <div data-part="body" data-testid="popover-body">
              <a>Non-focusable Link</a>
              <a href="#" data-testid="focusable-link">
                Focusable Link
              </a>
              <input placeholder="input" />
              <button {...popoverApi.getCloseTriggerProps()}>X</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
})
