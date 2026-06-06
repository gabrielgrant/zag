import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as checkbox from "@zag-js/checkbox"
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
    createMachineSerializer(checkbox.machine, {
      props: () => ({
        id,
        name: "checkbox",
        disabled: disabled.value,
        readOnly: readOnly.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => checkbox.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const root = bindPart$((api) => api.getRootProps(), parts)
  const control = bindPart$((api) => api.getControlProps(), parts)
  const label = bindPart$((api) => api.getLabelProps(), parts)
  const hiddenInput = bindPart$((api) => api.getHiddenInputProps(), parts)
  const indicator = bindPart$((api) => api.getIndicatorProps(), parts)
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
      <main class="checkbox">
        <form>
          <fieldset>
            <label ref={root.ref} {...root.props}>
              <div ref={control.ref} {...control.props} />
              <span ref={label.ref} {...label.props}>
                Input {api?.checked ? "Checked" : "Unchecked"}
              </span>
              <input ref={hiddenInput.ref} data-testid="hidden-input" {...hiddenInput.props} />
              <div ref={indicator.ref} {...indicator.props}>
                Indicator
              </div>
            </label>

            <div>
              <button disabled={api?.checked} onClick$={() => api?.setChecked(true)} type="button">
                Check
              </button>
              <button disabled={!api?.checked} onClick$={() => api?.setChecked(false)} type="button">
                Uncheck
              </button>
              <button type="reset">Reset Form</button>
            </div>
          </fieldset>
        </form>
      </main>

      <Toolbar controls>
        <div q:slot="controls" class="controls-container">
          <div class="checkbox">
            <input
              ref={disabledControl.ref}
              checked={disabled.value}
              data-testid="disabled"
              id="checkbox-disabled"
              type="checkbox"
              {...disabledControl.props}
            />
            <label for="checkbox-disabled">disabled</label>
          </div>
          <div class="checkbox">
            <input
              ref={readOnlyControl.ref}
              checked={readOnly.value}
              data-testid="readOnly"
              id="checkbox-read-only"
              type="checkbox"
              {...readOnlyControl.props}
            />
            <label for="checkbox-read-only">readOnly</label>
          </div>
        </div>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Checkbox | Zag Qwik Examples",
}
