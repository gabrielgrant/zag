import { component$, useId, useSignal } from "@qwik.dev/core"
import * as menu from "@zag-js/menu"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { menuControls, menuOptionData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(menuControls)

  const order = useSignal("")
  const type = useSignal<string[]>([])

  const service = useMachine(menu.machine, { id: useId() })
  const api = menu.connect(service, normalizeProps)

  const radios = menuOptionData.order.map((item) => ({
    type: "radio" as const,
    name: "order",
    value: item.value,
    label: item.label,
    checked: order.value === item.value,
    onCheckedChange: (checked: boolean) => (order.value = checked ? item.value : ""),
  }))

  const checkboxes = menuOptionData.type.map((item) => ({
    type: "checkbox" as const,
    name: "type",
    value: item.value,
    label: item.label,
    checked: type.value.includes(item.value),
    onCheckedChange: (checked: boolean) =>
      (type.value = checked ? [...type.value, item.value] : type.value.filter((x) => x !== item.value)),
  }))

  return (
    <>
      <main>
        <div>
          <button data-testid="trigger" {...api.getTriggerProps()}>
            Actions <span {...api.getIndicatorProps()}>▾</span>
          </button>

          <div {...api.getPositionerProps()}>
            <div {...api.getContentProps()}>
              {radios.map((item) => (
                <div key={item.value} {...api.getOptionItemProps(item)}>
                  <span {...api.getItemIndicatorProps(item)}>✅</span>
                  <span {...api.getItemTextProps(item)}>{item.label}</span>
                </div>
              ))}
              <hr />
              {checkboxes.map((item) => (
                <div key={item.value} {...api.getOptionItemProps(item)}>
                  <span {...api.getItemIndicatorProps(item)}>✅</span>
                  <span {...api.getItemTextProps(item)}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
