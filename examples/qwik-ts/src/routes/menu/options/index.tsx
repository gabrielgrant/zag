import { component$, useId, useSignal, type Signal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as menu from "@zag-js/menu"
import { menuOptionData } from "@zag-js/shared"
import type { QwikMachineSignal } from "@zag-js/qwik"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  usePart$,
} from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

interface MenuOptionItemProps {
  label: string
  machine: QwikMachineSignal<any>
  selected: Signal<string | string[]>
  type: "checkbox" | "radio"
  value: string
}

const MenuOptionItem = component$((props: MenuOptionItemProps) => {
  const item = usePart$(() => {
    const currentValue = props.selected.value
    const checked =
      props.type === "radio"
        ? currentValue === props.value
        : Array.isArray(currentValue) && currentValue.includes(props.value)

    return menu.connect(props.machine.controller.value.service, normalizeProps).getOptionItemProps({
      type: props.type,
      value: props.value,
      checked,
      onCheckedChange: (checked: boolean) => {
        if (props.type === "radio") {
          props.selected.value = checked ? props.value : ""
          return
        }

        const currentValue = props.selected.value
        if (!Array.isArray(currentValue)) return

        props.selected.value = checked
          ? [...currentValue, props.value]
          : currentValue.filter((value) => value !== props.value)
      },
    })
  }, props.machine)

  const api = menu.connect(props.machine.controller.value.service, normalizeProps)
  const currentValue = props.selected.value
  const checked =
    props.type === "radio"
      ? currentValue === props.value
      : Array.isArray(currentValue) && currentValue.includes(props.value)
  const itemBaseProps = { value: props.value, checked }

  return (
    <div ref={item.ref} {...item.props}>
      <span {...api.getItemIndicatorProps(itemBaseProps)}>✅</span>
      <span {...api.getItemTextProps(itemBaseProps)}>{props.label}</span>
    </div>
  )
})

export default component$(() => {
  const id = useId()
  const order = useSignal("")
  const type = useSignal<string[]>([])

  const machine = useMachine$(() =>
    createMachineSerializer(menu.machine, {
      props: () => ({
        id,
      }),
    }),
  )

  const parts = useConnectedParts$(() => menu.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const trigger = bindPart$((api) => api.getTriggerProps(), parts)
  const positioner = bindPart$((api) => api.getPositionerProps(), parts)
  const content = bindPart$((api) => api.getContentProps(), parts)
  const separatorProps = api?.getSeparatorProps?.() ?? {}
  const indicatorProps = api?.getIndicatorProps?.() ?? {}

  const radios = menuOptionData.order.map((item) => ({
    value: item.value,
    label: item.label,
  }))
  const checkboxes = menuOptionData.type.map((item) => ({
    value: item.value,
    label: item.label,
  }))

  return (
    <>
      <main>
        <div>
          <button data-testid="trigger" ref={trigger.ref} {...trigger.props}>
            Actions <span {...indicatorProps}>▾</span>
          </button>

          <div ref={positioner.ref} {...positioner.props}>
            <div ref={content.ref} {...content.props}>
              {radios.map((item) => (
                <MenuOptionItem
                  key={item.value}
                  label={item.label}
                  machine={machine}
                  selected={order}
                  type="radio"
                  value={item.value}
                />
              ))}
              <hr {...separatorProps} />
              {checkboxes.map((item) => (
                <MenuOptionItem
                  key={item.value}
                  label={item.label}
                  machine={machine}
                  selected={type}
                  type="checkbox"
                  value={item.value}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Toolbar>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Menu Options | Zag Qwik Examples",
}
