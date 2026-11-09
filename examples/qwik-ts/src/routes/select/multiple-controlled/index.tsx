import { component$, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as select from "@zag-js/select"
import { selectData } from "@zag-js/shared"

interface Item {
  label: string
  value: string
}

const Select = component$((props: { id: string }) => {
  const open = useSignal(false)

  const service = useMachine(
    select.machine as select.Machine<Item>,
    () =>
      ({
        collection: select.collection({ items: selectData }),
        id: props.id,
        name: "country",
        open: open.value,
        onOpenChange(details: select.OpenChangeDetails) {
          open.value = details.open
        },
      }) as select.Props<Item>,
  )

  const api = select.connect(service, normalizeProps)

  return (
    <div {...api.getRootProps()}>
      <div {...api.getControlProps()}>
        <button {...api.getTriggerProps()}>
          <span>{api.valueAsString || "Select option"}</span>
          <span {...api.getIndicatorProps()}>▼</span>
        </button>
      </div>
      <div {...api.getPositionerProps()}>
        <ul {...api.getContentProps()}>
          {selectData.map((item) => (
            <li key={item.value} {...api.getItemProps({ item })}>
              <span {...api.getItemTextProps({ item })}>{item.label}</span>
              <span {...api.getItemIndicatorProps({ item })}>✓</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
})

export default component$(() => {
  return (
    <main class="select">
      <div style={{ display: "flex", gap: "4px" }}>
        <Select id="a" />
        <Select id="b" />
      </div>
    </main>
  )
})
