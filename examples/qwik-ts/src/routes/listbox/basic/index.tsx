import { component$, useId } from "@qwik.dev/core"
import * as listbox from "@zag-js/listbox"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { listboxControls, selectData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

interface Item {
  label: string
  value: string
}

export default component$(() => {
  const controls = useControls(listboxControls)
  const id = useId()

  const collection = listbox.collection({ items: selectData })

  const service = useMachine(
    listbox.machine as listbox.Machine<Item>,
    () =>
      ({
        collection,
        id,
        ...controls.values(),
      }) as listbox.Props<Item>,
  )

  const api = listbox.connect(service, normalizeProps)

  return (
    <>
      <main class="listbox">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Label</label>
          <ul {...api.getContentProps()}>
            {selectData.map((item) => (
              <li key={item.value} {...api.getItemProps({ item })}>
                <span {...api.getItemTextProps({ item })}>{item.label}</span>
                <span {...api.getItemIndicatorProps({ item })}>✓</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} context={["highlightedValue"]} />
      </Toolbar>
    </>
  )
})
