import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { splitterControls } from "@zag-js/shared"
import * as splitter from "@zag-js/splitter"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(splitterControls)
  const id = useId()

  const service = useMachine(splitter.machine, {
    ...controls.state,
    id,
    panels: [{ id: "a" }, { id: "b" }, { id: "c" }],
  } as splitter.Props)

  const api = splitter.connect(service, normalizeProps)

  return (
    <>
      <main class="splitter">
        <pre>{JSON.stringify(api.getSizes())}</pre>
        <div {...api.getRootProps()}>
          <div {...api.getPanelProps({ id: "a" })}>
            <p>Left</p>
          </div>
          <div data-testid="trigger-a:b" {...api.getResizeTriggerProps({ id: "a:b" })} />
          <div {...api.getPanelProps({ id: "b" })}>
            <p>Middle</p>
          </div>
          <div data-testid="trigger-b:c" {...api.getResizeTriggerProps({ id: "b:c" })} />
          <div {...api.getPanelProps({ id: "c" })}>
            <p>Right</p>
          </div>
        </div>
      </main>

      <Toolbar controls={controls}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
