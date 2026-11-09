import { component$, useId } from "@qwik.dev/core"
import * as floating from "@zag-js/floating-panel"
import * as popover from "@zag-js/popover"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

const Popover = component$(() => {
  const service = useMachine(popover.machine, {
    id: useId(),
    portalled: false,
  })

  const api = popover.connect(service, normalizeProps)

  // React wraps the positioner in a Portal when api.portalled; it is false here
  return (
    <div>
      <button {...api.getTriggerProps()}>Open Popover</button>
      <div {...api.getPositionerProps()}>
        <div {...api.getContentProps()}>
          <div {...api.getTitleProps()}>Nested Popover</div>
          <div {...api.getDescriptionProps()}>Press Escape to close this popover without closing the panel.</div>
          <button {...api.getCloseTriggerProps()}>Close Popover</button>
        </div>
      </div>
    </div>
  )
})

export default component$(() => {
  const service = useMachine(floating.machine, {
    id: useId(),
    closeOnEscape: true,
    defaultSize: { width: 400, height: 300 },
  })

  const api = floating.connect(service, normalizeProps)

  return (
    <>
      <main class="floating-panel">
        <div>
          <button {...api.getTriggerProps()}>Toggle Panel</button>
          <div {...api.getPositionerProps()}>
            <div {...api.getContentProps()}>
              <div {...api.getDragTriggerProps()}>
                <div {...api.getHeaderProps()}>
                  <p {...api.getTitleProps()}>Floating Panel (Nested Popover)</p>
                  <div {...api.getControlProps()}>
                    <button {...api.getStageTriggerProps({ stage: "minimized" })}>—</button>
                    <button {...api.getStageTriggerProps({ stage: "maximized" })}>▢</button>
                    <button {...api.getStageTriggerProps({ stage: "default" })}>↙</button>
                    <button {...api.getCloseTriggerProps()}>✕</button>
                  </div>
                </div>
              </div>
              <div {...api.getBodyProps()}>
                <p>Escape closes the popover first, then the panel.</p>
                <Popover />
              </div>

              {floating.resizeTriggerAxes.map((axis) => (
                <div key={axis} {...api.getResizeTriggerProps({ axis })} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Toolbar controls={null}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
