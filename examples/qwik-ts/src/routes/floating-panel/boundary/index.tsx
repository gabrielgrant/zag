import { component$, useId, useSignal } from "@qwik.dev/core"
import * as floating from "@zag-js/floating-panel"
import { normalizeProps, useMachine } from "@zag-js/qwik"

export default component$(() => {
  const boundaryRef = useSignal<HTMLDivElement>()
  const strategy = useSignal<"fixed" | "absolute">("fixed")
  const id = useId()

  const service = useMachine(floating.machine, () => ({
    id,
    getBoundaryEl: () => boundaryRef.value ?? null,
    strategy: strategy.value,
  }))

  const api = floating.connect(service, normalizeProps)

  return (
    <main class="floating-panel">
      <div class="scroll-area" data-testid="scroller">
        <p>Scroll this area. The panel stays inside the dashed boundary.</p>
        <button onClick$={() => (strategy.value = strategy.value === "fixed" ? "absolute" : "fixed")}>
          Toggle strategy
        </button>
        <p>strategy: {strategy.value}</p>
        <div class="scroll-spacer" />
        <div class="boundary" ref={boundaryRef} data-testid="boundary">
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
        <div class="scroll-spacer" />
      </div>
    </main>
  )
})
