import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as scrollArea from "@zag-js/scroll-area"
import { scrollAreaControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: scrollArea.Api<any> } = {}

export default component$(() => {
  const controls = useControls(scrollAreaControls)
  const id = useId()

  const service = useMachine(
    scrollArea.machine,
    () =>
      ({
        id,
        ...controls.values(),
      }) as scrollArea.Props,
  )

  const api = scrollArea.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="scroll-area">
        <button onClick$={() => apiRef.current?.scrollToEdge({ edge: "bottom" })}>Scroll to bottom</button>
        <div {...api.getRootProps()}>
          <div {...api.getViewportProps()}>
            <div {...api.getContentProps()} style={{ minWidth: "800px" }}>
              {Array.from({ length: 100 }).map((_, index) => (
                <div key={index}>{index}</div>
              ))}
            </div>
          </div>
          {api.hasOverflowY && (
            <div {...api.getScrollbarProps({ orientation: "vertical" })}>
              <div {...api.getThumbProps({ orientation: "vertical" })} />
            </div>
          )}
          {api.hasOverflowX && (
            <div {...api.getScrollbarProps({ orientation: "horizontal" })}>
              <div {...api.getThumbProps({ orientation: "horizontal" })} />
            </div>
          )}
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
