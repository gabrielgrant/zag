import { component$, useId } from "@qwik.dev/core"
import * as pinInput from "@zag-js/pin-input"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { pinInputControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

/** see basic pin-input example: live api handle for custom (non-zag) buttons */
const apiRef: { current?: pinInput.Api } = {}

export default component$(() => {
  const controls = useControls(pinInputControls)
  const id = useId()

  const service = useMachine(pinInput.machine, () => ({
    name: "test",
    id,
    count: 3,
    autoSubmit: true,
    sanitizeValue: (value: string) => value.replace(/-/g, ""),
    ...controls.values(),
  }))

  const api = pinInput.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="pin-input">
        <form preventdefault:submit>
          <div {...api.getRootProps()}>
            <label {...api.getLabelProps()}>Enter code:</label>
            <div {...api.getControlProps()}>
              {api.items.map((index) => (
                <input key={index} data-testid={`input-${index + 1}`} {...api.getInputProps({ index })} />
              ))}
            </div>
            <input {...api.getHiddenInputProps()} />
          </div>
          <button data-testid="clear-button" type="button" onClick$={() => apiRef.current?.clearValue()}>
            Clear
          </button>
          <button type="button" onClick$={() => apiRef.current?.focus()}>
            Focus
          </button>
        </form>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} context={["value", "focusedIndex"]} />
      </Toolbar>
    </>
  )
})
