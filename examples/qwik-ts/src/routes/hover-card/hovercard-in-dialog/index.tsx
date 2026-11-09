import { component$, useId } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
import * as hoverCard from "@zag-js/hover-card"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"

// React portals the hover card into the dialog content (`Portal container`);
// here it renders inline, which already places it inside the dialog content
const HoverCard = component$(() => {
  const service = useMachine(hoverCard.machine, { id: useId() })
  const api = hoverCard.connect(service, normalizeProps)
  return (
    <>
      <a href="https://twitter.com/zag_js" target="_blank" rel="noreferrer" {...api.getTriggerProps()}>
        Twitter
      </a>
      {api.open && (
        <div {...api.getPositionerProps()}>
          <div {...mergeProps(api.getContentProps(), { style: { width: "200px", height: "200px" } })}>
            <div {...api.getArrowProps()}>
              <div {...api.getArrowTipProps()} />
            </div>
            Twitter Preview
            <a href="https://twitter.com/zag_js" target="_blank" rel="noreferrer">
              Twitter
            </a>
          </div>
        </div>
      )}
    </>
  )
})

export default component$(() => {
  const service = useMachine(dialog.machine, { id: useId(), initialFocusEl: null as any })
  const api = dialog.connect(service, normalizeProps)
  return (
    <div style={{ padding: "20px" }}>
      <button {...api.getTriggerProps()} data-testid="trigger-1">
        Open Dialog
      </button>
      {api.open && (
        <>
          <div {...api.getBackdropProps()} />
          <div data-testid="positioner-1" {...api.getPositionerProps()}>
            <div {...mergeProps(api.getContentProps(), { style: { width: "400px", height: "400px" } })}>
              <HoverCard />
            </div>
          </div>
        </>
      )}
    </div>
  )
})
