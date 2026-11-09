import { component$, Slot, useId, type CSSProperties } from "@qwik.dev/core"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import * as scrollArea from "@zag-js/scroll-area"

// component$ (not an inline component) so each instance owns its machine;
// only the serializable `style` crosses the boundary, children go through <Slot />
const ScrollArea = component$<{ style?: CSSProperties }>((props) => {
  const service = useMachine(scrollArea.machine, { id: useId() })
  const api = scrollArea.connect(service, normalizeProps)

  return (
    <div {...mergeProps(api.getRootProps(), { style: props.style })}>
      <div {...api.getViewportProps()}>
        <div {...api.getContentProps()}>
          <Slot />
        </div>
      </div>
      {api.hasOverflowY && (
        <div {...api.getScrollbarProps()}>
          <div {...api.getThumbProps()} />
        </div>
      )}
    </div>
  )
})

export default component$(() => {
  return (
    <main class="scroll-area">
      <ScrollArea style={{ height: "500px", width: "800px" }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <ScrollArea key={index} style={{ maxHeight: "200px" }}>
            {Array.from({ length: 100 }).map((_, index) => (
              <div key={index}>{index}</div>
            ))}
          </ScrollArea>
        ))}
      </ScrollArea>
    </main>
  )
})
