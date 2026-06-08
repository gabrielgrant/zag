import { $, component$, useId, useSignal } from "@qwik.dev/core"
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
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

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
  const value = useSignal(["", "", ""])
  const machine = useMachine$(() =>
    createMachineSerializer(pinInput.machine, {
      props: () => ({
        id,
        name: "test",
        count: 3,
        value: value.value,
      }),
    }),
  )

  const updateValue = $((nextValue: string[]) => {
    value.value = nextValue
    machine.controller.value.updateProps({ value: nextValue })
  })

  machine.controller.value.updateProps({
    value: value.value,
    onValueChange(details: { value: string[] }) {
      updateValue(details.value)
    },
  })

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
          onSubmit$={(event) => {
            event.preventDefault()
            console.log("submitted:", value.value.join(""))
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

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button data-testid="clear-button" onClick$={() => api?.clearValue()} type="button">
              Clear
            </button>
            <button onClick$={() => api?.focus()} type="button">
              Focus
            </button>
            <button data-testid="set-value" onClick$={() => updateValue(["1", "2", "3"])} type="button">
              Set 1-2-3
            </button>
            <button data-testid="reset-value" onClick$={() => updateValue(["", "", ""])} type="button">
              Reset
            </button>
          </div>
        </form>

        <div style={{ marginTop: "1rem", padding: "0.5rem", background: "#f5f5f5", borderRadius: "4px" }}>
          <strong>Controlled value:</strong> [{value.value.map((v) => `"${v}"`).join(", ")}]
        </div>
      </main>

      <Toolbar>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Pin Input Controlled | Zag Qwik Examples",
}
