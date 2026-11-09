import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { splitterControls } from "@zag-js/shared"
import * as splitter from "@zag-js/splitter"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  // as in the React example, the controls are shown but not wired into the machine
  const controls = useControls(splitterControls)
  const id = useId()

  const service = useMachine(splitter.machine, {
    id,
    panels: [
      { id: "a", collapsible: true, collapsedSize: 5, minSize: 10, maxSize: 20 },
      { id: "b", minSize: 50 },
    ],
    defaultSize: [15, 85],
    onCollapse: (details) => {
      console.log("onCollapse", details)
    },
    onExpand: (details) => {
      console.log("onExpand", details)
    },
  })

  const api = splitter.connect(service, normalizeProps)

  return (
    <>
      <main class="splitter">
        <div {...api.getRootProps()}>
          <div {...api.getPanelProps({ id: "a" })}>
            <p>A</p>
          </div>
          <div {...api.getResizeTriggerProps({ id: "a:b" })} />
          <div {...api.getPanelProps({ id: "b" })}>
            <p>B</p>
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
