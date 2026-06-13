import { component$, useId, useSignal } from "@qwik.dev/core"
import * as asyncList from "@zag-js/async-list"
import * as combobox from "@zag-js/combobox"
import { normalizeProps, useMachine } from "@zag-js/qwik"

interface Item {
  name: string
  url: string
}

export default component$(() => {
  const id = useId()
  const listId = useId()
  const selected = useSignal<string[]>([])

  const listService = useMachine(
    asyncList.machine as asyncList.Machine<Item, string>,
    () =>
      ({
        id: listId,
        autoReload: true,
        async load({ signal, filterText }: { signal: AbortSignal; filterText?: string }) {
          const response = await fetch(`https://swapi.py4e.com/api/people/?search=${filterText ?? ""}`, { signal })
          const data = await response.json()
          return {
            items: data.results ?? [],
            cursor: data.next ?? null,
          }
        },
      }) as asyncList.Props<Item, string>,
  )
  const list = asyncList.connect(listService)

  const collection = combobox.collection({
    items: list.items,
    itemToValue: (item) => item.name,
    itemToString: (item) => item.name,
  })

  const service = useMachine(
    combobox.machine as combobox.Machine<Item>,
    () =>
      ({
        id,
        collection,
        placeholder: "Search people...",
        onInputValueChange({ inputValue }: combobox.InputValueChangeDetails) {
          list.setFilterText(inputValue)
        },
        onValueChange({ value }: combobox.ValueChangeDetails) {
          selected.value = value
        },
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)

  return (
    <main class="combobox" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "360px" }}>
        <div data-testid="selected-value" style={{ fontSize: "0.875rem" }}>
          <strong>Selected:</strong> {selected.value.join(", ")}
        </div>

        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Search Star Wars characters</label>
          <div {...api.getControlProps()} style={{ display: "flex", marginTop: "4px" }}>
            <input data-testid="input" {...api.getInputProps()} style={{ flex: 1, padding: "8px 12px" }} />
            <button data-testid="trigger" {...api.getTriggerProps()} style={{ padding: "8px" }}>
              ▼
            </button>
          </div>
        </div>

        {list.loading && (
          <div data-testid="loading" style={{ fontSize: "0.875rem" }}>
            Loading...
          </div>
        )}

        <div {...api.getPositionerProps()}>
          {api.collection.items.length > 0 && (
            <ul data-testid="combobox-content" {...api.getContentProps()} style={{ listStyle: "none", padding: "4px" }}>
              {api.collection.items.map((item) => (
                <li
                  key={item.name}
                  data-testid={`item-${item.name}`}
                  {...api.getItemProps({ item })}
                  style={{ padding: "8px 12px", cursor: "pointer" }}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
})
