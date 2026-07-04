import { component$, useId, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import * as floating from "@zag-js/floating-panel"
import { normalizeProps, useMachine } from "@zag-js/qwik"

const AutoSizingContent = component$(() => {
  const ref = useSignal<HTMLDivElement>()
  const size = useSignal({ width: 0, height: 0 })

  useVisibleTask$(({ cleanup }) => {
    const node = ref.value
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      size.value = { width: Math.round(width), height: Math.round(height) }
    })
    observer.observe(node)
    cleanup(() => observer.disconnect())
  })

  return (
    <div
      ref={ref}
      style={{
        resize: "horizontal",
        overflow: "auto",
        minWidth: "180px",
        maxWidth: "100%",
        padding: "0.5rem",
        border: "1px solid #d4d4d8",
        borderRadius: "0.5rem",
      }}
    >
      ResizeObserver box: {size.value.width}x{size.value.height}
    </div>
  )
})

export default component$(() => {
  const id = useId()
  const open = useSignal(false)
  const size = useSignal({ width: 360, height: 260 })
  const position = useSignal({ x: 120, y: 120 })

  const service = useMachine(floating.machine, () => ({
    id,
    open: open.value,
    defaultOpen: true,
    size: size.value,
    position: position.value,
    onOpenChange(details: floating.OpenChangeDetails) {
      open.value = details.open
    },
    onSizeChange(details: floating.SizeChangeDetails) {
      size.value = details.size
    },
    onPositionChange(details: floating.PositionChangeDetails) {
      position.value = details.position
    },
  }))

  const api = floating.connect(service, normalizeProps)

  return (
    <main class="floating-panel">
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <button onClick$={() => (open.value = !open.value)}>{open.value ? "Close" : "Open"} panel</button>
        <button onClick$={() => (size.value = { width: 420, height: 320 })}>Set size: 420x320</button>
        <button onClick$={() => (position.value = { x: 32, y: 32 })}>Set position: (32, 32)</button>
        <button
          onClick$={() => {
            size.value = { width: 360, height: 260 }
            position.value = { x: 120, y: 120 }
          }}
        >
          Reset rect
        </button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        size: {Math.round(api.size.width)}x{Math.round(api.size.height)} | position: ({Math.round(api.position.x)},{" "}
        {Math.round(api.position.y)})
      </div>

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
              <p>Drag and resize to update external state.</p>
              <p>Use the buttons above for externally controlled size and position.</p>
              <AutoSizingContent />
            </div>

            {floating.resizeTriggerAxes.map((axis) => (
              <div key={axis} {...api.getResizeTriggerProps({ axis })} />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
})
