import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import { toggleGroupData } from "@zag-js/shared"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  usePart$,
  type QwikMachineSignal,
} from "@zag-js/qwik"
import * as toggleGroup from "@zag-js/toggle-group"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

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
  const disabled = useSignal(false)
  const loopFocus = useSignal(true)
  const multiple = useSignal(false)
  const rovingFocus = useSignal(true)
  const machine = useMachine$(() =>
    createMachineSerializer(toggleGroup.machine, {
      props: () => ({
        id,
        disabled: disabled.value,
        loopFocus: loopFocus.value,
        multiple: multiple.value,
        rovingFocus: rovingFocus.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => toggleGroup.connect(machine.controller.value.service, normalizeProps), machine)
  const root = bindPart$((api) => api.getRootProps(), parts)
  const disabledControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        disabled.value = checked
        machine.controller.value.updateProps({ disabled: checked })
      },
    }),
    machine,
  )
  const loopFocusControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        loopFocus.value = checked
        machine.controller.value.updateProps({ loopFocus: checked })
      },
    }),
    machine,
  )
  const multipleControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        multiple.value = checked
        machine.controller.value.updateProps({ multiple: checked })
      },
    }),
    machine,
  )
  const rovingFocusControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        rovingFocus.value = checked
        machine.controller.value.updateProps({ rovingFocus: checked })
      },
    }),
    machine,
  )

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

      <Toolbar controls>
        <div q:slot="controls" class="controls-container">
          <div class="checkbox">
            <input
              checked={disabled.value}
              data-testid="disabled"
              id="toggle-group-disabled"
              ref={disabledControl.ref}
              type="checkbox"
              {...disabledControl.props}
            />
            <label for="toggle-group-disabled">disabled</label>
          </div>
          <div class="checkbox">
            <input
              checked={loopFocus.value}
              data-testid="loopFocus"
              id="toggle-group-loop-focus"
              ref={loopFocusControl.ref}
              type="checkbox"
              {...loopFocusControl.props}
            />
            <label for="toggle-group-loop-focus">loopFocus</label>
          </div>
          <div class="checkbox">
            <input
              checked={multiple.value}
              data-testid="multiple"
              id="toggle-group-multiple"
              ref={multipleControl.ref}
              type="checkbox"
              {...multipleControl.props}
            />
            <label for="toggle-group-multiple">multiple</label>
          </div>
          <div class="checkbox">
            <input
              checked={rovingFocus.value}
              data-testid="rovingFocus"
              id="toggle-group-roving-focus"
              ref={rovingFocusControl.ref}
              type="checkbox"
              {...rovingFocusControl.props}
            />
            <label for="toggle-group-roving-focus">rovingFocus</label>
          </div>
        </div>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Toggle Group | Zag Qwik Examples",
}
