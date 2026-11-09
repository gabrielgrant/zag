import { component$, useId, useSignal } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { normalizeProps, useMachine } from "@zag-js/qwik"

interface Link {
  label: string
  href: string
}

const links: Link[] = [
  { label: "Basic", href: "/combobox/basic" },
  { label: "Async", href: "/combobox/async" },
  { label: "Multiple", href: "/combobox/multiple" },
]

export default component$(() => {
  const id = useId()
  const items = useSignal<Link[]>(links)
  const selection = useSignal<combobox.SelectionDetails | null>(null)

  const collection = combobox.collection({
    items: items.value,
    itemToValue: (item) => item.href,
    itemToString: (item) => item.label,
  })

  const service = useMachine(
    combobox.machine as combobox.Machine<Link>,
    () =>
      ({
        id,
        collection,
        onSelect(details: combobox.SelectionDetails) {
          selection.value = details
        },
        onInputValueChange({ inputValue }: combobox.InputValueChangeDetails) {
          items.value = links.filter((item) => item.label.toLowerCase().includes(inputValue.toLowerCase()))
        },
      }) as combobox.Props<Link>,
  )

  const api = combobox.connect(service, normalizeProps)

  return (
    <main class="combobox">
      <div {...api.getRootProps()}>
        <label {...api.getLabelProps()}>Go to page</label>
        <div {...api.getControlProps()}>
          <input data-testid="input" {...api.getInputProps()} />
        </div>
      </div>
      <div {...api.getPositionerProps()}>
        <div data-testid="combobox-content" {...api.getContentProps()}>
          {items.value.map((item) => (
            <a key={item.href} href={item.href} {...api.getItemProps({ item })}>
              {item.label}
            </a>
          ))}
        </div>
      </div>
      <pre data-testid="selection">{JSON.stringify(selection.value)}</pre>
    </main>
  )
})
