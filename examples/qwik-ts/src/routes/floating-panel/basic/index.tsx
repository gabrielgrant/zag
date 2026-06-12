import { component$, useId } from "@qwik.dev/core"
import * as floating from "@zag-js/floating-panel"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { floatingPanelControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(floatingPanelControls)
  const id = useId()

  const service = useMachine(floating.machine, () => ({
    id,
    ...controls.values(),
  }))

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
                  <p {...api.getTitleProps()}>Floating Panel</p>
                  <div {...api.getControlProps()}>
                    <button {...api.getStageTriggerProps({ stage: "minimized" })}>—</button>
                    <button {...api.getStageTriggerProps({ stage: "maximized" })}>▢</button>
                    <button {...api.getStageTriggerProps({ stage: "default" })}>↙</button>
                    <button {...api.getCloseTriggerProps()}>✕</button>
                  </div>
                </div>
              </div>
              <div {...api.getBodyProps()}>
                <p>Some content</p>
              </div>

              {floating.resizeTriggerAxes.map((axis) => (
                <div key={axis} {...api.getResizeTriggerProps({ axis })} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
