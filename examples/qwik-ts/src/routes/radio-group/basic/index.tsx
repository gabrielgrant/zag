import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as radio from "@zag-js/radio-group"
import { radioControls, radioData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(radioControls)
  const id = useId()

  const service = useMachine(
    radio.machine,
    () =>
      ({
        id,
        name: "fruits",
        ...controls.values(),
      }) as radio.Props,
  )

  const api = radio.connect(service, normalizeProps)

  return (
    <>
      <main class="radio">
        <form>
          <fieldset disabled={false}>
            <div {...api.getRootProps()}>
              <h3 {...api.getLabelProps()}>Fruits</h3>
              <div {...api.getIndicatorProps()} />
              {radioData.map((opt) => (
                <label key={opt.id} data-testid={`radio-${opt.id}`} {...api.getItemProps({ value: opt.id })}>
                  <div data-testid={`control-${opt.id}`} {...api.getItemControlProps({ value: opt.id })} />
                  <span data-testid={`label-${opt.id}`} {...api.getItemTextProps({ value: opt.id })}>
                    {opt.label}
                  </span>
                  <input data-testid={`input-${opt.id}`} {...api.getItemHiddenInputProps({ value: opt.id })} />
                </label>
              ))}
            </div>

            <button type="reset">Reset</button>
          </fieldset>
        </form>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
