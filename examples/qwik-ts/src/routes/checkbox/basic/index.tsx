import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as checkbox from "@zag-js/checkbox"
import { bindPart$, createMachineSerializer, normalizeProps, useConnectedParts$, useMachine$ } from "@zag-js/qwik"
import { checkboxControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const id = useId()
  const controls = useControls(checkboxControls)
  const machine = useMachine$(() =>
    createMachineSerializer(checkbox.machine, {
      props: () => ({
        id,
        ...controls.context.value,
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
  title: "Checkbox | Zag Qwik Examples",
}
