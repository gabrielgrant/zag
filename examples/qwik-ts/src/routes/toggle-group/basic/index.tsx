import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { toggleGroupControls, toggleGroupData } from "@zag-js/shared"
import * as toggle from "@zag-js/toggle-group"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(toggleGroupControls)
  const id = useId()

  const service = useMachine(
    toggle.machine,
    () =>
      ({
        id,
        ...controls.values(),
      }) as toggle.Props,
  )

  const api = toggle.connect(service, normalizeProps)

  return (
    <>
      <main class="toggle-group">
        <button>Outside</button>
        <div {...api.getRootProps()}>
          {toggleGroupData.map((item) => (
            <button key={item.value} {...api.getItemProps({ value: item.value })}>
              {item.label}
            </button>
          ))}
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
