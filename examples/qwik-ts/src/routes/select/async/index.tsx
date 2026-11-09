import { component$, useId, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as select from "@zag-js/select"
import { selectControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

interface Item {
  name: string
  url: string
}

export default component$(() => {
  const controls = useControls(selectControls)
  const id = useId()

  const items = useSignal<Item[]>([])

  useVisibleTask$(
    async () => {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon`)
      const json = await res.json()
      items.value = json.results
    },
    { strategy: "document-ready" },
  )

  const collection = select.collection({
    items: items.value,
    itemToString(item) {
      return item.name
    },
    itemToValue(item) {
      return item.name
    },
  })

  const service = useMachine(
    select.machine as select.Machine<Item>,
    () =>
      ({
        id,
        collection,
      }) as select.Props<Item>,
  )

  const api = select.connect(service, normalizeProps)

  return (
    <>
      <main class="select">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Label</label>
          <div {...api.getControlProps()}>
            <button {...api.getTriggerProps()}>
              <span>{api.hasSelectedItems ? api.valueAsString : "Select option"}</span>
              <span>▼</span>
            </button>
            <button {...api.getClearTriggerProps()}>X</button>
          </div>

          <div {...api.getPositionerProps()}>
            <ul {...api.getContentProps()}>
              {items.value.map((item) => (
                <li key={item.name} {...api.getItemProps({ item })}>
                  <span {...api.getItemTextProps({ item })}>{item.name}</span>
                  <span {...api.getItemIndicatorProps({ item })}>✓</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref} viz>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
