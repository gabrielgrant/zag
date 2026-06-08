import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import { toggleGroupControls, toggleGroupData } from "@zag-js/shared"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  type QwikMachineSignal,
} from "@zag-js/qwik"
import * as toggleGroup from "@zag-js/toggle-group"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

interface ToggleItemProps {
  label: string
  machine: QwikMachineSignal<any>
  value: string
}

const ToggleItem = component$<ToggleItemProps>(({ label, machine, value }) => {
  const parts = useConnectedParts$(() => toggleGroup.connect(machine.controller.value.service, normalizeProps), machine)
  const item = bindPart$((api) => api.getItemProps({ value }), parts)

  return (
    <button ref={item.ref} {...item.props} type="button">
      {label}
    </button>
  )
})

export default component$(() => {
  const id = useId()
  const controls = useControls(toggleGroupControls)
  const machine = useMachine$(() =>
    createMachineSerializer(toggleGroup.machine, {
      props: () => ({
        id,
        ...controls.context.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => toggleGroup.connect(machine.controller.value.service, normalizeProps), machine)
  const root = bindPart$((api) => api.getRootProps(), parts)

  return (
    <>
      <main class="toggle-group">
        <button type="button">Outside</button>
        <div ref={root.ref} {...root.props}>
          {toggleGroupData.map((item) => (
            <ToggleItem key={item.value} label={item.label} machine={machine} value={item.value} />
          ))}
        </div>
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
  title: "Toggle Group | Zag Qwik Examples",
}
