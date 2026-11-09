import { component$, useId, useSignal } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { createFilter } from "@zag-js/i18n-utils"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import { selectData } from "@zag-js/shared"

interface Item {
  label: string
  value: string
}

const { contains } = createFilter({ sensitivity: "base" })

export default component$(() => {
  const id = useId()
  const options = useSignal<Item[]>(selectData)

  const collection = combobox.collection({ items: options.value })

  const service = useMachine(
    combobox.machine as combobox.Machine<Item>,
    () =>
      ({
        id,
        collection,
        selectionBehavior: "clear",
        inputBehavior: "autohighlight",
        composite: false,
        onOpenChange() {
          options.value = selectData
        },
        onInputValueChange({ inputValue }: combobox.InputValueChangeDetails) {
          const filtered = selectData.filter((item) => contains(item.label, inputValue))
          options.value = filtered.length > 0 ? filtered : selectData
        },
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)

  return (
    <main class="select">
      <div {...api.getRootProps()}>
        <div
          {...mergeProps(api.getControlProps(), {
            style: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
          })}
        >
          <label {...api.getLabelProps()}>Country</label>
          <button {...api.getTriggerProps({ focusable: true })}>
            <span>{api.valueAsString || "Select Country"} </span>
            <span>▼</span>
          </button>
        </div>

        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()}>
            <input style={{ position: "sticky", top: "0", width: "100%" }} {...api.getInputProps()} />
            <div {...api.getListProps()}>
              {options.value.map((item) => (
                <div key={item.value} {...api.getItemProps({ item })}>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
})
