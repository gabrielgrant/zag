import { component$, useId } from "@qwik.dev/core"
import * as checkbox from "@zag-js/checkbox"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { checkboxControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(checkboxControls)
  const id = useId()

  const service = useMachine(
    checkbox.machine,
    () =>
      ({
        id,
        ...controls.values(),
      }) as checkbox.Props,
  )

  const api = checkbox.connect(service, normalizeProps)

  return (
    <>
      <main class="checkbox">
        <form>
          <fieldset>
            <label {...api.getRootProps()}>
              <div {...api.getControlProps()} />
              <span {...api.getLabelProps()}>Input {api.checked ? "Checked" : "Unchecked"}</span>
              <input {...api.getHiddenInputProps()} data-testid="hidden-input" />
              <div {...api.getIndicatorProps()}>Indicator</div>
            </label>

            <div>
              <button type="reset">Reset Form</button>
            </div>
          </fieldset>
        </form>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
