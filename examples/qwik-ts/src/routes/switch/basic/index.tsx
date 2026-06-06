import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as zagSwitch from "@zag-js/switch"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  usePart$,
} from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

export default component$(() => {
  const id = useId()
  const disabled = useSignal(false)
  const readOnly = useSignal(false)
  const machine = useMachine$(() =>
    createMachineSerializer(zagSwitch.machine, {
      props: () => ({
        name: "switch",
        id,
        disabled: disabled.value,
        readOnly: readOnly.value,
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
  const readOnlyControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        readOnly.value = checked
        machine.controller.value.updateProps({ readOnly: checked })
      },
    }),
    machine,
  )

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

      <Toolbar controls>
        <div q:slot="controls" class="controls-container">
          <div class="checkbox">
            <input
              ref={disabledControl.ref}
              checked={disabled.value}
              data-testid="disabled"
              id="switch-disabled"
              type="checkbox"
              {...disabledControl.props}
            />
            <label for="switch-disabled">disabled</label>
          </div>
          <div class="checkbox">
            <input
              ref={readOnlyControl.ref}
              checked={readOnly.value}
              data-testid="readOnly"
              id="switch-read-only"
              type="checkbox"
              {...readOnlyControl.props}
            />
            <label for="switch-read-only">readOnly</label>
          </div>
        </div>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Switch | Zag Qwik Examples",
}
