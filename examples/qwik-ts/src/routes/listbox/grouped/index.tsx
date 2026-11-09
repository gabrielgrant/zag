import { component$, useId } from "@qwik.dev/core"
import * as listbox from "@zag-js/listbox"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { groupedData, listboxControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

type Item = (typeof groupedData)[number]

export default component$(() => {
  const controls = useControls(listboxControls)
  const id = useId()

  const collection = listbox.collection({ items: groupedData, groupBy: (item) => item.type })

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
          <div {...api.getContentProps()}>
            {collection.group().map(([type, items]) => (
              <div key={type} {...api.getItemGroupProps({ id: type })}>
                <div {...api.getItemGroupLabelProps({ htmlFor: type })}>{type}</div>
                {items.map((item) => (
                  <div key={item.value} {...api.getItemProps({ item })}>
                    <span {...api.getItemTextProps({ item })}>{item.label}</span>
                    <span {...api.getItemIndicatorProps({ item })}>✓</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref} viz>
        <StateVisualizer state={service} context={["highlightedValue"]} />
      </Toolbar>
    </>
  )
})
