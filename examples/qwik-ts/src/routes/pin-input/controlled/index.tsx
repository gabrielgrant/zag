import { component$, useId, useSignal } from "@qwik.dev/core"
import * as pinInput from "@zag-js/pin-input"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

/** see basic pin-input example: live api handle for custom (non-zag) buttons */
const apiRef: { current?: pinInput.Api } = {}

export default component$(() => {
  const id = useId()
  const value = useSignal<string[]>(["", "", ""])

  const service = useMachine(pinInput.machine, () => ({
    id,
    name: "test",
    count: 3,
    value: value.value,
    onValueChange(details: pinInput.ValueChangeDetails) {
      value.value = details.value
    },
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

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" data-testid="clear-button" onClick$={() => apiRef.current?.clearValue()}>
              Clear
            </button>
            <button type="button" onClick$={() => apiRef.current?.focus()}>
              Focus
            </button>
            <button type="button" data-testid="set-value" onClick$={() => (value.value = ["1", "2", "3"])}>
              Set 1-2-3
            </button>
            <button type="button" data-testid="reset-value" onClick$={() => (value.value = ["", "", ""])}>
              Reset
            </button>
          </div>
        </form>

        <div style={{ marginTop: "1rem", padding: "0.5rem", background: "#f5f5f5", borderRadius: "4px" }}>
          <strong>Controlled value:</strong> [{value.value.map((v) => `"${v}"`).join(", ")}]
        </div>
      </main>

      <Toolbar controls={null}>
        <StateVisualizer state={service} context={["value", "focusedIndex"]} />
      </Toolbar>
    </>
  )
})
