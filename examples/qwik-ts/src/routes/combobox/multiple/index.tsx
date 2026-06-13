import { component$, useId, useSignal } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { createFilter } from "@zag-js/i18n-utils"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { comboboxData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

interface Item {
  code: string
  label: string
}

const { contains } = createFilter({ sensitivity: "base" })

const multipleControls = {
  removeSelected: {
    type: "boolean" as const,
    defaultValue: false,
  },
}

export default component$(() => {
  const controls = useControls(multipleControls)
  const id = useId()

  const options = useSignal<Item[]>(comboboxData)
  const selectedValue = useSignal<string[]>([])

  const removeSelected = controls.state.removeSelected
  const items = removeSelected
    ? options.value.filter((item) => !selectedValue.value.includes(item.code))
    : options.value

  const collection = combobox.collection({
    items,
    itemToValue: (item) => item.code,
    itemToString: (item) => item.label,
  })

  const service = useMachine(
    combobox.machine as combobox.Machine<Item>,
    () =>
      ({
        id,
        collection,
        onInputValueChange({ inputValue }: combobox.InputValueChangeDetails) {
          const filtered = comboboxData.filter((item) => contains(item.label, inputValue))
          options.value = filtered.length > 0 ? filtered : comboboxData
        },
        multiple: true,
        // the react page resets options in the trigger's merged onClick;
        // resetting on open is equivalent without clobbering zag's handler
        onOpenChange() {
          options.value = comboboxData
        },
        onValueChange({ value }: combobox.ValueChangeDetails) {
          selectedValue.value = value
        },
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)

  return (
    <>
      <main class="combobox">
        <div>
          <b>{service.state.get()}</b>
          <b> / {api.highlightedValue || "-"}</b>
          <pre data-testid="value-text">{api.valueAsString}</pre>
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
