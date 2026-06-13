import { component$, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as select from "@zag-js/select"

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

  const collection = select.collection({
    items: options.value,
    itemToValue: (item) => item.value,
    itemToString: (item) => item.label,
  })

  const service = useMachine(
    select.machine as select.Machine<Item>,
    () =>
      ({
        id,
        collection,
        value: value.value,
        onValueChange: (e: select.ValueChangeDetails) => (value.value = e.value),
      }) as select.Props<Item>,
  )

  const api = select.connect(service, normalizeProps)

  return (
    <main class="select" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "320px" }}>
        <div data-testid="selected-items" style={{ fontSize: "0.875rem" }}>
          <strong>Selected items (from api):</strong> {api.selectedItems.map((item) => item.label).join(", ")}
        </div>

        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Select framework</label>
          <div {...api.getControlProps()} style={{ display: "flex", marginTop: "4px" }}>
            <button data-testid="trigger" {...api.getTriggerProps()} style={{ padding: "8px 12px", flex: 1 }}>
              <span>{api.valueAsString || "Select option"}</span>
              <span style={{ marginLeft: "8px" }}>▼</span>
            </button>
          </div>

          <div {...api.getPositionerProps()}>
            <ul data-testid="select-content" {...api.getContentProps()} style={{ listStyle: "none", padding: "4px" }}>
              {options.value.map((item) => (
                <li
                  key={item.value}
                  data-testid={item.value}
                  {...api.getItemProps({ item })}
                  style={{ padding: "8px 12px" }}
                >
                  <span {...api.getItemTextProps({ item })}>{item.label}</span>
                  <span {...api.getItemIndicatorProps({ item })}>✓</span>
                </li>
              ))}
            </ul>
          </div>
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
