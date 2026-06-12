import { component$, useId } from "@qwik.dev/core"
import * as hoverCard from "@zag-js/hover-card"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { hoverCardControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(hoverCardControls)
  const id = useId()

  const service = useMachine(hoverCard.machine, {
    ...controls.state,
    id,
  } as hoverCard.Props)

  const api = hoverCard.connect(service, normalizeProps)

  return (
    <>
      <main class="hover-card">
        <div style={{ display: "flex", gap: "50px" }}>
          <a href="https://twitter.com/zag_js" target="_blank" rel="noreferrer" {...api.getTriggerProps()}>
            Twitter
          </a>

          {api.open && (
            <div {...api.getPositionerProps()}>
              <div {...api.getContentProps()}>
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

          <div data-part="test-text">Test text</div>
        </div>
      </main>

      <Toolbar controls={controls}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
