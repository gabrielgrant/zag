import { component$, useId, useSignal } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { createFilter } from "@zag-js/i18n-utils"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { comboboxControls, groupedData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

type Item = (typeof groupedData)[number]

const { contains } = createFilter({ sensitivity: "base" })

export default component$(() => {
  const controls = useControls(comboboxControls)
  const id = useId()

  const options = useSignal<Item[]>(groupedData)

  const collection = combobox.collection({ items: options.value, groupBy: (item) => item.type })

  const service = useMachine(
    combobox.machine as combobox.Machine<Item>,
    () =>
      ({
        id,
        collection,
        onOpenChange({ open }: combobox.OpenChangeDetails) {
          if (!open) options.value = groupedData
        },
        onInputValueChange({ inputValue }: combobox.InputValueChangeDetails) {
          const filtered = groupedData.filter((item) => contains(item.label, inputValue))
          options.value = filtered.length > 0 ? filtered : groupedData
        },
        ...controls.values(),
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)

  return (
    <>
      <main class="combobox">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Select produce</label>
          <div {...api.getControlProps()}>
            <input data-testid="input" {...api.getInputProps()} />
            <button data-testid="trigger" {...api.getTriggerProps()}>
              ▼
            </button>
            <button {...api.getClearTriggerProps()}>✕</button>
          </div>
        </div>
        <div {...api.getPositionerProps()}>
          {options.value.length > 0 && (
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
          )}
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
