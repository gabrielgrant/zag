import { component$, useId, useSignal } from "@qwik.dev/core"
import { createFilter } from "@zag-js/i18n-utils"
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
  const search = useSignal("")

  const filter = createFilter({ sensitivity: "base" })
  const items = selectData.filter((item) => filter.startsWith(item.label, search.value))
  const collection = listbox.collection({ items })

  const controls = useControls(listboxControls)
  const id = useId()

  const service = useMachine(
    listbox.machine as listbox.Machine<Item>,
    () =>
      ({
        collection,
        id,
        ...controls.values(),
        typeahead: false,
      }) as listbox.Props<Item>,
  )

  const api = listbox.connect(service, normalizeProps)

  return (
    <>
      <main class="listbox">
        {/* the input's own `onInput$` belongs to the machine (React chains a
            separate `onChange`), so the search text is read from the bubbling
            input event on the root instead */}
        <div
          {...api.getRootProps()}
          onInput$={(event) => {
            const target = event.target as HTMLInputElement
            if (target.dataset.part === "input") search.value = target.value
          }}
        >
          <input {...api.getInputProps({ autoHighlight: true })} value={search.value} />
          <ul {...api.getContentProps()}>
            {collection.items.map((item) => (
              <li key={item.value} {...api.getItemProps({ item })}>
                <span {...api.getItemTextProps({ item })}>{item.label}</span>
                <span {...api.getItemIndicatorProps({ item })}>✓</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Toolbar controls={controls.ref} viz>
        <StateVisualizer state={service} context={["highlightedValue", "focused"]} />
      </Toolbar>
    </>
  )
})
