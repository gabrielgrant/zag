import { component$, useId, useSignal } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { createFilter } from "@zag-js/i18n-utils"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { comboboxData } from "@zag-js/shared"

interface Item {
  code: string
  label: string
}

const { contains } = createFilter({ sensitivity: "base" })

export default component$(() => {
  const id = useId()
  const options = useSignal<Item[]>(comboboxData)

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
        name: "country",
        onInputValueChange({ inputValue }: combobox.InputValueChangeDetails) {
          options.value = comboboxData.filter((item) => contains(item.label, inputValue))
        },
        allowCustomValue: true,
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)

  return (
    <main class="combobox">
      <form
        preventdefault:submit
        onSubmit$={(_, form) => {
          const data = new FormData(form)
          console.log(data.get("country"))
        }}
      >
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
      </form>
    </main>
  )
})
