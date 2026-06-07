import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as numberInput from "@zag-js/number-input"
import { bindPart$, createMachineSerializer, normalizeProps, useConnectedParts$, useMachine$ } from "@zag-js/qwik"
import { numberInputControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { Controls, useControls } from "~/hooks/use-controls"

export default component$(() => {
  const id = useId()
  const controls = useControls(numberInputControls)

  const machine = useMachine$(() =>
    createMachineSerializer(numberInput.machine, {
      props: () => ({
        id,
        ...controls.context.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => numberInput.connect(machine.controller.value.service, normalizeProps), machine)
  const root = bindPart$((api) => api.getRootProps(), parts)
  const scrubber = bindPart$((api) => api.getScrubberProps(), parts)
  const label = bindPart$((api) => api.getLabelProps(), parts)
  const control = bindPart$((api) => api.getControlProps(), parts)
  const decrement = bindPart$((api) => api.getDecrementTriggerProps(), parts)
  const input = bindPart$((api) => api.getInputProps(), parts)
  const increment = bindPart$((api) => api.getIncrementTriggerProps(), parts)

  return (
    <>
      <main>
        <div ref={root.ref} {...root.props}>
          <div data-testid="scrubber" ref={scrubber.ref} {...scrubber.props} />
          <label data-testid="label" ref={label.ref} {...label.props}>
            Enter number:
          </label>
          <div ref={control.ref} {...control.props}>
            <button data-testid="dec-button" ref={decrement.ref} {...decrement.props}>
              DEC
            </button>
            <input data-testid="input" ref={input.ref} {...input.props} />
            <button data-testid="inc-button" ref={increment.ref} {...increment.props}>
              INC
            </button>
          </div>
        </div>
      </main>

      <Toolbar controls>
        <Controls
          config={controls.config}
          onChange$={(context) => {
            machine.controller.value.updateProps(context)
          }}
          q:slot="controls"
          state={controls.state}
        />
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Number Input | Zag Qwik Examples",
}
