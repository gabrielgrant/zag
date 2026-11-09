import { component$, useId, useSignal } from "@qwik.dev/core"
import * as asyncList from "@zag-js/async-list"
import * as combobox from "@zag-js/combobox"
import { normalizeProps, useMachine } from "@zag-js/qwik"

interface Item {
  name: string
  height: string
  mass: string
  created: string
  edited: string
  url: string
}

export default component$(() => {
  const id = useId()
  const listId = useId()
  // `useRef` in the React example: a plain (non-reactive) flag inside the signal value
  const hydrated = useSignal({ current: false })

  const listService = useMachine(
    asyncList.machine as asyncList.Machine<Item, string>,
    () =>
      ({
        id: listId,
        autoReload: true,
        async load({ signal, filterText }: { signal: AbortSignal; filterText?: string }) {
          const response = await fetch(`https://swapi.py4e.com/api/people/?search=${filterText}`, { signal })
          const data = await response.json()
          return {
            items: data.results,
            cursor: data.next,
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
        defaultValue: ["C-3PO"],
        placeholder: "Example: Dexter",
        onInputValueChange({ inputValue }: combobox.InputValueChangeDetails) {
          list.setFilterText(inputValue)
        },
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)

  if (api.value.length && api.collection.size && !hydrated.value.current) {
    api.syncSelectedItems()
    hydrated.value.current = true
  }

  return (
    <main class="combobox">
      <div {...api.getRootProps()}>
        <label {...api.getLabelProps()}>Select country</label>
        <div {...api.getControlProps()}>
          <input data-testid="input" {...api.getInputProps()} />
          <button data-testid="trigger" {...api.getTriggerProps()}>
            ▼
          </button>
          <button {...api.getClearTriggerProps()}>✕</button>
        </div>
      </div>
      <div {...api.getPositionerProps()}>
        {api.collection.items.length > 0 && (
          <ul data-testid="combobox-content" {...api.getContentProps()}>
            {api.collection.items.map((item) => (
              <li data-testid={item.name} key={item.name} {...api.getItemProps({ item })}>
                <span {...api.getItemIndicatorProps({ item })}>✅</span>
                <span>{item.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
})
