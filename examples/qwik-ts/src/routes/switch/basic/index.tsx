import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as zagSwitch from "@zag-js/switch"
import { bindPart$, createMachineSerializer, normalizeProps, useConnectedParts$, useMachine$ } from "@zag-js/qwik"
import { switchControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const id = useId()
  const controls = useControls(switchControls)
  const machine = useMachine$(() =>
    createMachineSerializer(zagSwitch.machine, {
      props: () => ({
        name: "switch",
        id,
        ...controls.context.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => zagSwitch.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const root = bindPart$((api) => api.getRootProps(), parts)
  const hiddenInput = bindPart$((api) => api.getHiddenInputProps(), parts)
  const control = bindPart$((api) => api.getControlProps(), parts)
  const thumb = bindPart$((api) => api.getThumbProps(), parts)
  const label = bindPart$((api) => api.getLabelProps(), parts)

  return (
    <>
      <main class="switch">
        <label ref={root.ref} {...root.props}>
          <input ref={hiddenInput.ref} {...hiddenInput.props} />
          <span ref={control.ref} {...control.props}>
            <span ref={thumb.ref} {...thumb.props} />
          </span>
          <span ref={label.ref} {...label.props}>
            Feature is {api?.checked ? "enabled" : "disabled"}
          </span>
        </label>
      </main>

      <Toolbar
        controls={controls}
        onControlsChange$={(context) => {
          machine.controller.value.updateProps(context)
        }}
      >
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Switch | Zag Qwik Examples",
}
