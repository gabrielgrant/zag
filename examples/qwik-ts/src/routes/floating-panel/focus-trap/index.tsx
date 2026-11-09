import { component$, useId, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import * as floating from "@zag-js/floating-panel"
import { trapFocus } from "@zag-js/focus-trap"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

export default component$(() => {
  const id = useId()
  const contentRef = useSignal<HTMLDivElement>()
  // mirrors api.open for the focus-trap task (a task cannot capture the api)
  const open = useSignal(false)

  const service = useMachine(floating.machine, () => ({
    id,
    closeOnEscape: true,
    onOpenChange: (details: floating.OpenChangeDetails) => (open.value = details.open),
  }))

  const api = floating.connect(service, normalizeProps)

  // React: useFocusTrap(contentRef, { enabled: api.open })
  useVisibleTask$(({ track, cleanup }) => {
    const enabled = track(() => open.value)
    if (!enabled) return
    const el = contentRef.value
    if (!el) return
    cleanup(trapFocus(el))
  })

  return (
    <>
      <main class="floating-panel">
        <div>
          <button {...api.getTriggerProps()}>Toggle Panel</button>
          <div {...api.getPositionerProps()}>
            <div {...api.getContentProps()} ref={contentRef}>
              <div {...api.getDragTriggerProps()}>
                <div {...api.getHeaderProps()}>
                  <p {...api.getTitleProps()}>Floating Panel (Focus Trap)</p>
                  <div {...api.getControlProps()}>
                    <button {...api.getStageTriggerProps({ stage: "minimized" })}>—</button>
                    <button {...api.getStageTriggerProps({ stage: "maximized" })}>▢</button>
                    <button {...api.getStageTriggerProps({ stage: "default" })}>↙</button>
                    <button {...api.getCloseTriggerProps()}>✕</button>
                  </div>
                </div>
              </div>
              <div {...api.getBodyProps()}>
                <p>Focus is trapped within this panel when open.</p>
                <label>
                  Name
                  <input type="text" placeholder="Enter name" />
                </label>
                <label>
                  Email
                  <input type="email" placeholder="Enter email" />
                </label>
                <button type="button">Submit</button>
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
