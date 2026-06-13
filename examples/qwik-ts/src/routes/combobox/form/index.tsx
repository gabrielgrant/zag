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

export default component$(() => {
  const controls = useControls(comboboxControls)
  const id = useId()

  const options = useSignal<Item[]>(comboboxData)
  const submitCount = useSignal(0)
  const lastSubmit = useSignal<string | null>(null)

  const collection = combobox.collection<Item>({
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
        onOpenChange() {
          options.value = comboboxData
        },
        onInputValueChange({ inputValue }: combobox.InputValueChangeDetails) {
          options.value = comboboxData.filter((item) => contains(item.label, inputValue))
        },
        ...controls.values(),
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)

  return (
    <>
      <main class="combobox">
        <form
          preventdefault:submit
          onSubmit$={(_e, el) => {
            const data = new FormData(el)
            lastSubmit.value = String(data.get("country") ?? "")
            submitCount.value++
          }}
        >
          <div {...api.getRootProps()}>
            <label {...api.getLabelProps()}>Select country</label>
            <div {...api.getControlProps()}>
              <input data-testid="input" {...api.getInputProps()} />
              <button data-testid="trigger" type="button" {...api.getTriggerProps()}>
                ▼
              </button>
              <button type="button" {...api.getClearTriggerProps()}>
                ✕
              </button>
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

          <div style={{ marginTop: "16px" }}>
            <button type="submit">Submit</button>
          </div>
        </form>

        <section style={{ marginTop: "16px" }}>
          <strong>submit count:</strong> <span data-testid="submit-count">{submitCount.value}</span>
          <br />
          <strong>last submitted value:</strong> <span data-testid="last-submit">{lastSubmit.value ?? "—"}</span>
        </section>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
