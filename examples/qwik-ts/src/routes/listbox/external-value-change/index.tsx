import { component$, useId, useSignal } from "@qwik.dev/core"
import * as listbox from "@zag-js/listbox"
import { normalizeProps, useMachine } from "@zag-js/qwik"

interface Item {
  label: string
  value: string
}

const frameworks: Item[] = [
  { label: "React", value: "react" },
  { label: "Solid", value: "solid" },
  { label: "Vue", value: "vue" },
]

export default component$(() => {
  const id = useId()
  const value = useSignal<string[]>(["react"])
  const options = useSignal<Item[]>(frameworks)

  const collection = listbox.collection({
    items: options.value,
    itemToValue: (item) => item.value,
    itemToString: (item) => item.label,
  })

  const service = useMachine(listbox.machine as listbox.Machine<Item>, () => ({
    id,
    collection,
    value: value.value,
    onValueChange: (e: listbox.ValueChangeDetails<Item>) => (value.value = e.value),
  }))

  const api = listbox.connect(service, normalizeProps)

  return (
    <main class="listbox" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "320px" }}>
        <div data-testid="selected-items" style={{ fontSize: "0.875rem" }}>
          <strong>Selected items (from api):</strong> {api.selectedItems.map((item) => item.label).join(", ")}
        </div>
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Select framework</label>
          <ul data-testid="listbox-content" {...api.getContentProps()}>
            {options.value.map((item) => (
              <li key={item.value} data-testid={item.value} {...api.getItemProps({ item })}>
                <span {...api.getItemTextProps({ item })}>{item.label}</span>
                <span {...api.getItemIndicatorProps({ item })}>✓</span>
              </li>
            ))}
          </ul>
        </div>

        <button data-testid="filter-vue-button" onClick$={() => (options.value = [frameworks[2]])}>
          Filter to Vue
        </button>
        <button
          data-testid="set-solid-button"
          onClick$={() => {
            options.value = frameworks
            value.value = ["solid"]
          }}
        >
          Set value to Solid
        </button>
      </div>
    </main>
  )
})
