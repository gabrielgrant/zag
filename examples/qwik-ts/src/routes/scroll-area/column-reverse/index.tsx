import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as scrollArea from "@zag-js/scroll-area"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

export default component$(() => {
  const id = useId()
  const service = useMachine(scrollArea.machine, { id })

  const api = scrollArea.connect(service, normalizeProps)

  return (
    <>
      <main class="scroll-area">
        <div {...api.getRootProps()}>
          <div {...api.getViewportProps()}>
            <div {...api.getContentProps()} style={{ display: "flex", flexDirection: "column-reverse" }}>
              {Array.from({ length: 100 }).map((_, index) => (
                <div key={index}>Item {index}</div>
              ))}
            </div>
          </div>
          {api.hasOverflowY && (
            <div {...api.getScrollbarProps({ orientation: "vertical" })}>
              <div {...api.getThumbProps({ orientation: "vertical" })} />
            </div>
          )}
        </div>
      </main>

      <Toolbar>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
