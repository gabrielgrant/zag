import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as pinInput from "@zag-js/pin-input"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  type QwikMachineSignal,
} from "@zag-js/qwik"
import { pinInputControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

interface PinInputFieldProps {
  index: number
  machine: QwikMachineSignal<any>
}

const PinInputField = component$<PinInputFieldProps>(({ index, machine }) => {
  const parts = useConnectedParts$(() => pinInput.connect(machine.controller.value.service, normalizeProps), machine)
  const input = bindPart$((api) => api.getInputProps({ index }), parts)

  return <input data-testid={`input-${index + 1}`} ref={input.ref} {...input.props} />
})

export default component$(() => {
  const id = useId()
  const controls = useControls(pinInputControls)

  const machine = useMachine$(() =>
    createMachineSerializer(pinInput.machine, {
      props: () => ({
        id,
        name: "test",
        count: 3,
        ...controls.context.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => pinInput.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const root = bindPart$((api) => api.getRootProps(), parts)
  const label = bindPart$((api) => api.getLabelProps(), parts)
  const control = bindPart$((api) => api.getControlProps(), parts)
  const hiddenInput = bindPart$((api) => api.getHiddenInputProps(), parts)

  return (
    <>
      <main class="pin-input">
        <form
          preventdefault:submit
          onSubmit$={(event, currentTarget) => {
            event.preventDefault()
            const formData = Object.fromEntries(new FormData(currentTarget))
            console.log(formData)
          }}
        >
          <div ref={root.ref} {...root.props}>
            <label ref={label.ref} {...label.props}>
              Enter code:
            </label>
            <div ref={control.ref} {...control.props}>
              {api?.items.map((index) => (
                <PinInputField index={index} key={index} machine={machine} />
              ))}
            </div>
            <input ref={hiddenInput.ref} {...hiddenInput.props} tabIndex={-1} />
          </div>
          <button data-testid="clear-button" onClick$={() => api?.clearValue()} type="button">
            Clear
          </button>
          <button onClick$={() => api?.focus()} type="button">
            Focus
          </button>
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
  title: "Pin Input | Zag Qwik Examples",
}
