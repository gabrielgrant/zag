import { component$, useId, useSignal } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { createFilter } from "@zag-js/i18n-utils"
import { normalizeProps, useMachine } from "@zag-js/qwik"

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
  { label: "Qwik", value: "qwik" },
  { label: "Lit", value: "lit" },
  { label: "Alpine.js", value: "alpinejs" },
  { label: "Ember", value: "ember" },
  { label: "Next.js", value: "nextjs" },
]

const { contains } = createFilter({ sensitivity: "base" })

export default component$(() => {
  const id = useId()
  const value = useSignal<string[]>(["react"])
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
        onValueChange: (e: combobox.ValueChangeDetails) => (value.value = e.value),
        onOpenChange: () => {
          options.value = frameworks
        },
        onInputValueChange: ({ inputValue }: combobox.InputValueChangeDetails) => {
          const filtered = frameworks.filter((item) => contains(item.label, inputValue))
          options.value = filtered.length > 0 ? filtered : frameworks
        },
        placeholder: "Type to search",
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)

  return (
    <main class="combobox" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "320px" }}>
        <div style={{ fontSize: "0.875rem" }}>
          <strong>Selected:</strong> {value.value.length > 0 ? value.value.join(", ") : "N/A"}
          <pre style={{ maxWidth: "400px", overflow: "auto" }}>{JSON.stringify(collection.toString(), null, 2)}</pre>
        </div>

        <div>
          <label {...api.getLabelProps()}>Select framework</label>
          <div {...api.getControlProps()} style={{ display: "flex", marginTop: "4px" }}>
            <input
              data-testid="input"
              {...api.getInputProps()}
              style={{ flex: 1, padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px" }}
            />
            <button data-testid="trigger" {...api.getTriggerProps()} style={{ padding: "8px" }}>
              ▼
            </button>
          </div>
        </div>

        <div {...api.getPositionerProps()}>
          <ul
            data-testid="combobox-content"
            {...api.getContentProps()}
            style={{
              listStyle: "none",
              margin: "0",
              padding: "4px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginTop: "4px",
              maxHeight: "200px",
              overflow: "auto",
            }}
          >
            {options.value.map((item) => (
              <li
                data-testid={item.value}
                key={item.value}
                {...api.getItemProps({ item })}
                style={{ padding: "8px 12px", cursor: "pointer" }}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <button
          data-testid="set-solid-button"
          onClick$={() => {
            options.value = frameworks
            value.value = ["solid"]
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: "#3182ce",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Set value to "Solid" externally
        </button>
      </div>
    </main>
  )
})
