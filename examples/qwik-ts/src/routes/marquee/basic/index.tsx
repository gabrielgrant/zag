import { component$, useId } from "@qwik.dev/core"
import * as marquee from "@zag-js/marquee"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { marqueeControls, marqueeData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

/**
 * QRL handlers can't capture the (non-serializable) connect api directly;
 * a module-level holder, refreshed on every render, gives them a live
 * reference once the component is activated.
 */
const apiRef: { current?: marquee.Api } = {}

export default component$(() => {
  const controls = useControls(marqueeControls)
  const id = useId()

  const service = useMachine(
    marquee.machine,
    () =>
      ({
        id,
        spacing: "2rem",
        ...controls.values(),
      }) as marquee.Props,
  )

  const api = marquee.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="marquee">
        <div {...api.getRootProps()}>
          <div {...api.getEdgeProps({ side: "start" })} />

          <div {...api.getViewportProps()}>
            {Array.from({ length: api.contentCount }).map((_, index) => (
              <div key={index} {...api.getContentProps({ index })}>
                {marqueeData.map((item, i) => (
                  <div key={i} {...api.getItemProps()}>
                    <span class="marquee-logo">{item.logo}</span>
                    <span class="marquee-name">{item.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div {...api.getEdgeProps({ side: "end" })} />
        </div>

        <div class="controls">
          <button onClick$={() => apiRef.current?.pause()}>Pause</button>
          <button onClick$={() => apiRef.current?.resume()}>Resume</button>
          <button onClick$={() => apiRef.current?.togglePause()}>Toggle</button>
          <span>Status: {api.paused ? "Paused" : "Playing"}</span>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
