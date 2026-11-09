import { component$, useId, useSignal, type Signal } from "@qwik.dev/core"
import * as listbox from "@zag-js/listbox"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"

interface Item {
  label: string
  value: string
}

interface ListBoxProps {
  label?: string
  // plain items (serializable) — the collection is rebuilt from them each render
  items: Item[]
  // the selection lives in the parent so its move buttons can read it
  selected: Signal<Item[]>
}

const ListBox = component$<ListBoxProps>((props) => {
  const id = useId()

  const collection = listbox.collection<Item>({ items: props.items })

  const service = useMachine(
    listbox.machine as listbox.Machine<Item>,
    () =>
      ({
        id,
        selectionMode: "multiple",
        collection,
        value: props.selected.value.map((item) => item.value),
        onValueChange(e) {
          props.selected.value = e.items
        },
      }) as listbox.Props<Item>,
  )

  const api = listbox.connect(service, normalizeProps)

  return (
    <div {...mergeProps(api.getRootProps(), { style: { flex: "1" } })}>
      {props.label && <label {...api.getLabelProps()}>{props.label}</label>}
      <ul {...mergeProps(api.getContentProps(), { style: { width: "100%", height: "100%" } })}>
        {collection.items.map((item) => (
          <li key={item.value} {...api.getItemProps({ item })}>
            <span {...api.getItemTextProps({ item })}>{item.label}</span>
            <span {...api.getItemIndicatorProps({ item })}>✓</span>
          </li>
        ))}
      </ul>
    </div>
  )
})

const without = (items: Item[], removed: Item[]) => items.filter((item) => !removed.some((r) => r.value === item.value))

export default component$(() => {
  const source = useSignal<Item[]>([
    { label: "Naruto", value: "naruto" },
    { label: "Sasuke", value: "sasuke" },
    { label: "Sakura", value: "sakura" },
    { label: "Kakashi", value: "kakashi" },
    { label: "Shisui", value: "shisui" },
  ])

  const target = useSignal<Item[]>([])

  const selectedSource = useSignal<Item[]>([])
  const selectedTarget = useSignal<Item[]>([])

  return (
    <main class="listbox">
      <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
        <ListBox items={source.value} label="Source" selected={selectedSource} />
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          <button
            onClick$={() => {
              source.value = without(source.value, selectedSource.value)
              target.value = [...target.value, ...selectedSource.value]
              selectedSource.value = []
            }}
          >
            Move Right
          </button>
          <button
            onClick$={() => {
              source.value = [...source.value, ...selectedTarget.value]
              target.value = without(target.value, selectedTarget.value)
              selectedTarget.value = []
            }}
          >
            Move Left
          </button>
        </div>
        <ListBox items={target.value} label="Target" selected={selectedTarget} />
      </div>
    </main>
  )
})
