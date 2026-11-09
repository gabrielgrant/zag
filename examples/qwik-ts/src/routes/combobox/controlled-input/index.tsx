import { component$, useId, useSignal } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { createFilter } from "@zag-js/i18n-utils"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"

interface Item {
  label: string
  value: string
}

const frameworks: Item[] = [
  { label: "React", value: "react" },
  { label: "Solid", value: "solid" },
  { label: "Vue", value: "vue" },
  { label: "Angular", value: "angular" },
  { label: "Svelte", value: "svelte" },
  { label: "Preact", value: "preact" },
]

const { contains } = createFilter({ sensitivity: "base" })

export default component$(() => {
  const id = useId()
  const value = useSignal<string[]>([])
  const inputValue = useSignal("")
  const options = useSignal<Item[]>(frameworks)

  const collection = combobox.collection({
    items: options.value,
    itemToValue: (item) => item.value,
    itemToString: (item) => item.label,
  })

  const service = useMachine(
    combobox.machine as combobox.Machine<Item>,
    () =>
      ({
        id,
        collection,
        value: value.value,
        inputValue: inputValue.value,
        onValueChange(e: combobox.ValueChangeDetails) {
          value.value = e.value
          if (e.value.length > 0) {
            const item = frameworks.find((f) => f.value === e.value[0])
            if (item) inputValue.value = item.label
          }
        },
        onInputValueChange({ inputValue: v }: combobox.InputValueChangeDetails) {
          inputValue.value = v
          options.value = frameworks.filter((item) => contains(item.label, v))
        },
        onOpenChange(e: combobox.OpenChangeDetails) {
          if (e.reason === "trigger-click") {
            options.value = frameworks
          }
        },
        placeholder: "Type to search",
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)

  return (
    <main class="combobox" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "320px" }}>
        <div style={{ fontSize: "0.875rem" }}>
          <strong>Value:</strong> {value.value.length > 0 ? value.value.join(", ") : "—"}
        </div>
        <div style={{ fontSize: "0.875rem" }}>
          <strong>Input (controlled):</strong> {inputValue.value || "—"}
        </div>

        <div>
          <label {...api.getLabelProps()}>Select framework</label>
          <div {...mergeProps(api.getControlProps(), { style: { display: "flex", marginTop: "4px" } })}>
            <input
              data-testid="input"
              {...mergeProps(api.getInputProps(), {
                style: {
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                },
              })}
            />
            <button data-testid="trigger" {...mergeProps(api.getTriggerProps(), { style: { padding: "8px" } })}>
              ▼
            </button>
          </div>
        </div>

        <div {...api.getPositionerProps()}>
          <ul
            data-testid="combobox-content"
            {...mergeProps(api.getContentProps(), {
              style: {
                listStyle: "none",
                margin: 0,
                padding: "4px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                marginTop: "4px",
                maxHeight: "200px",
                overflow: "auto",
              },
            })}
          >
            {options.value.map((item) => (
              <li
                data-testid={item.value}
                key={item.value}
                {...mergeProps(api.getItemProps({ item }), {
                  style: {
                    padding: "8px 12px",
                    cursor: "pointer",
                  },
                })}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <button
          data-testid="set-search-button"
          onClick$={() => (inputValue.value = "vue")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#3182ce",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Set input to &quot;vue&quot; externally
        </button>
      </div>
    </main>
  )
})
