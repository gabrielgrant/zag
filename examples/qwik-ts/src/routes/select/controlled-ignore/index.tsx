import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as select from "@zag-js/select"

interface Item {
  label: string
  value: string
}

const items: Item[] = [
  { label: "React", value: "react" },
  { label: "Vue", value: "vue" },
  { label: "Solid", value: "solid" },
]

const collection = select.collection({
  items,
  itemToValue: (item) => item.value,
  itemToString: (item) => item.label,
})

export default component$(() => {
  const id = useId()
  // Controller IGNORES selection changes - value is always ["react"]
  const value = ["react"]

  const service = useMachine(
    select.machine as select.Machine<Item>,
    () =>
      ({
        id,
        collection,
        value,
      }) as select.Props<Item>,
  )

  const api = select.connect(service, normalizeProps)

  return (
    <main class="select" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "320px" }}>
        <div style={{ fontSize: "0.875rem" }}>
          <strong>Value (controlled, fixed):</strong> {value.join(", ")}
        </div>
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
              {items.map((item) => (
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
      </div>
    </main>
  )
})
