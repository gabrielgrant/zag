import { component$, useId } from "@qwik.dev/core"
import * as numberInput from "@zag-js/number-input"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { numberInputControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(numberInputControls)
  const id = useId()

  const service = useMachine(
    numberInput.machine,
    () =>
      ({
        id,
        ...controls.values(),
      }) as numberInput.Props,
  )

  const api = numberInput.connect(service, normalizeProps)

  return (
    <>
      <main>
        <div {...api.getRootProps()}>
          <div data-testid="scrubber" {...api.getScrubberProps()} />
          <label data-testid="label" {...api.getLabelProps()}>
            Enter number:
          </label>
          <div {...api.getControlProps()}>
            <button data-testid="dec-button" {...api.getDecrementTriggerProps()}>
              DEC
            </button>
            <input data-testid="input" {...api.getInputProps()} />
            <button data-testid="inc-button" {...api.getIncrementTriggerProps()}>
              INC
            </button>
          </div>
        </div>
      </main>
      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} omit={["formatter", "parser"]} />
      </Toolbar>
    </>
  )
})
