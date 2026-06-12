import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { switchControls } from "@zag-js/shared"
import * as zagSwitch from "@zag-js/switch"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(switchControls)
  const id = useId()

  const service = useMachine(zagSwitch.machine, {
    ...controls.state,
    id,
    name: "switch",
  } as zagSwitch.Props)

  const api = zagSwitch.connect(service, normalizeProps)

  return (
    <>
      <main class="switch">
        <label {...api.getRootProps()}>
          <input {...api.getHiddenInputProps()} />
          <span {...api.getControlProps()}>
            <span {...api.getThumbProps()} />
          </span>
          <span {...api.getLabelProps()}>Feature is {api.checked ? "enabled" : "disabled"}</span>
        </label>
      </main>

      <Toolbar controls={controls}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
