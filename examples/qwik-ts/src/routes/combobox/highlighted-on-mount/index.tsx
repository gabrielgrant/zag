import { component$, useId } from "@qwik.dev/core"
import * as combobox from "@zag-js/combobox"
import { mergeProps, normalizeProps, useMachine } from "@zag-js/qwik"
import { comboboxData } from "@zag-js/shared"

interface Item {
  code: string
  label: string
}

export default component$(() => {
  const id = useId()

  const collection = combobox.collection({
    items: comboboxData as Item[],
    itemToValue: (item) => item.code,
    itemToString: (item) => item.label,
  })

  const service = useMachine(
    combobox.machine as combobox.Machine<Item>,
    () =>
      ({
        id,
        collection,
        open: true,
        disableLayer: true,
        defaultHighlightedValue: comboboxData[0].code,
      }) as combobox.Props<Item>,
  )

  const api = combobox.connect(service, normalizeProps)

  return (
    <>
      <style>{`
        html, body, .page, .page main {
          height: auto !important;
          overflow: visible !important;
        }
      `}</style>
      <main class="combobox">
        <div data-testid="spacer" style={{ height: "150vh" }} />
        <div {...api.getRootProps()}>
          <div {...api.getControlProps()}>
            <input data-testid="input" {...api.getInputProps()} />
          </div>
          <ul
            data-testid="combobox-content"
            {...mergeProps(api.getContentProps(), {
              style: { maxHeight: "12rem", overflow: "auto" },
            })}
          >
            {comboboxData.map((item) => (
              <li data-testid={item.code} key={item.code} {...api.getItemProps({ item })}>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  )
})
