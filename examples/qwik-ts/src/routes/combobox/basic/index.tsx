import { component$, useId, useSignal } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { createFilter } from "@zag-js/i18n-utils"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { comboboxControls, comboboxData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

interface Item {
  code: string
  label: string
}

const { contains } = createFilter({ sensitivity: "base" })

/** see pin-input example: live api handle for custom (non-zag) buttons */
const apiRef: { current?: combobox.Api } = {}

export default component$(() => {
  const controls = useControls(comboboxControls)
  const id = useId()

  const options = useSignal<Item[]>(comboboxData)
  const selectedItems = useSignal<Item[]>([])

  const collection = combobox.collection({
    items: options.value,
    itemToValue: (item) => item.code,
    itemToString: (item) => item.label,
  })

  const service = useMachine(
    combobox.machine as combobox.Machine<Item>,
    () =>
      ({
        id,
        collection,
        onOpenChange() {
          options.value = comboboxData
        },
        onInputValueChange({ inputValue }: combobox.InputValueChangeDetails) {
          const filtered = comboboxData.filter((item) => contains(item.label, inputValue))
          options.value = filtered.length > 0 ? filtered : comboboxData
        },
        onValueChange({ items }: combobox.ValueChangeDetails) {
          selectedItems.value = items as Item[]
        },
        ...controls.values(),
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)
  apiRef.current = api

  return (
    <>
      <main class="combobox">
        <div>
          <button onClick$={() => apiRef.current?.setValue(["TG"])}>Set to Togo</button>
          <button data-testid="clear-value-button" onClick$={() => apiRef.current?.clearValue()}>
            Clear Value
          </button>
          <pre data-testid="on-value-change-items">
            selectedItems: {selectedItems.value.map((item) => item.label).join(", ") || "N/A"}
          </pre>
          <br />
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
            {options.value.length > 0 && (
              <ul data-testid="combobox-content" {...api.getContentProps()}>
                {options.value.map((item) => (
                  <li data-testid={item.code} key={item.code} {...api.getItemProps({ item })}>
                    <span {...api.getItemIndicatorProps({ item })}>✅</span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
