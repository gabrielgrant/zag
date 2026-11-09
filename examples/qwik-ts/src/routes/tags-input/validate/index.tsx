import { component$, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as tagsInput from "@zag-js/tags-input"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

function toDashCase(str: string) {
  return str.replace(/\s+/g, "-").toLowerCase()
}

/**
 * Custom validate example: only allow lowercase alphabetic tags.
 * Duplicates are prevented by default. Use onValueInvalid for feedback.
 */
export default component$(() => {
  const invalidReason = useSignal<string | null>(null)
  const id = useId()

  const service = useMachine(
    tagsInput.machine,
    () =>
      ({
        id,
        defaultValue: ["react", "vue"],
        validate(details) {
          return /^[a-z]+$/.test(details.inputValue)
        },
        onValueChange() {
          invalidReason.value = null
        },
        onValueInvalid(details) {
          invalidReason.value = details.reason
        },
      }) as tagsInput.Props,
  )

  const api = tagsInput.connect(service, normalizeProps)

  return (
    <>
      <main class="tags-input">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Lowercase letters only:</label>
          <div {...api.getControlProps()}>
            {/* `null` instead of an empty mapped array, and keyed trailing
                siblings: see tags-input/basic */}
            {api.value.length === 0
              ? null
              : api.value.map((value, index) => (
                  <span key={`${toDashCase(value)}-tag-${index}`} {...api.getItemProps({ index, value })}>
                    <div {...api.getItemPreviewProps({ index, value })}>
                      <span {...api.getItemTextProps({ index, value })}>{value} </span>
                      <button {...api.getItemDeleteTriggerProps({ index, value })}>&#x2715;</button>
                    </div>
                    <input {...api.getItemInputProps({ index, value })} />
                  </span>
                ))}
            <input key="new-tag-input" placeholder="Try: svelte or React (rejected)" {...api.getInputProps()} />
            <button key="clear-button" {...api.getClearTriggerProps()}>
              Clear all
            </button>
          </div>
          {invalidReason.value && (
            <p style={{ marginTop: "8px", fontSize: "14px", color: "red" }}>Invalid: {invalidReason.value}</p>
          )}
          <input {...api.getHiddenInputProps()} />
        </div>
      </main>
      <Toolbar controls={null}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
