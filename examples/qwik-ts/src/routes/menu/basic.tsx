import { component$, useId, useSignal, useVisibleTask$ } from "@qwik.dev/core"
import * as menu from "@zag-js/menu"
import { createMachineSerializer, normalizeProps, useMachine$, usePart$ } from "@zag-js/qwik"

const menuItems = [
  { value: "edit", label: "Edit" },
  { value: "duplicate", label: "Duplicate" },
  { value: "delete", label: "Delete" },
  { value: "export", label: "Export..." },
]

export default component$(() => {
  const id = useId()
  const closeOnSelect = useSignal(true)
  const loopFocus = useSignal(false)
  const machine = useMachine$(() =>
    createMachineSerializer(menu.machine, {
      props: () => ({
        id,
        closeOnSelect: closeOnSelect.value,
        loopFocus: loopFocus.value,
      }),
    }),
  )

  useVisibleTask$(({ track }) => {
    track(() => closeOnSelect.value)
    track(() => loopFocus.value)
    machine.controller.value.updateProps({
      closeOnSelect: closeOnSelect.value,
      loopFocus: loopFocus.value,
    })
  })

  const api = menu.connect(machine.controller.value.service, normalizeProps)
  const trigger = usePart$(
    () => menu.connect(machine.controller.value.service, normalizeProps).getTriggerProps(),
    machine,
    api.getTriggerProps(),
  )
  const positioner = usePart$(
    () => menu.connect(machine.controller.value.service, normalizeProps).getPositionerProps(),
    machine,
    api.getPositionerProps(),
  )
  const content = usePart$(
    () => menu.connect(machine.controller.value.service, normalizeProps).getContentProps(),
    machine,
    api.getContentProps(),
  )

  useVisibleTask$(({ track, cleanup }) => {
    track(() => machine.revision.value)
    const currentApi = menu.connect(machine.controller.value.service, normalizeProps)
    if (!currentApi.open) return

    const frame = requestAnimationFrame(() => {
      ;(content.ref.value as HTMLElement | undefined)?.focus({ preventScroll: true })
    })

    cleanup(() => cancelAnimationFrame(frame))
  })

  const edit = usePart$(
    () => menu.connect(machine.controller.value.service, normalizeProps).getItemProps({ value: "edit" }),
    machine,
    api.getItemProps({ value: "edit" }),
  )
  const duplicate = usePart$(
    () => menu.connect(machine.controller.value.service, normalizeProps).getItemProps({ value: "duplicate" }),
    machine,
    api.getItemProps({ value: "duplicate" }),
  )
  const remove = usePart$(
    () => menu.connect(machine.controller.value.service, normalizeProps).getItemProps({ value: "delete" }),
    machine,
    api.getItemProps({ value: "delete" }),
  )
  const exportItem = usePart$(
    () => menu.connect(machine.controller.value.service, normalizeProps).getItemProps({ value: "export" }),
    machine,
    api.getItemProps({ value: "export" }),
  )
  const items = [edit, duplicate, remove, exportItem]

  return (
    <>
      <main>
        <div>
          <button ref={trigger.ref} {...trigger.props}>
            Actions <span {...api.getIndicatorProps()}>▾</span>
          </button>
          <div ref={positioner.ref} hidden={!api.open} {...positioner.props}>
            <ul ref={content.ref} {...content.props}>
              {menuItems.map((item, index) => (
                <li key={item.value} ref={items[index].ref} {...items[index].props}>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <div class="toolbar">
        <nav>
          <button type="button">Visualizer</button>
          <button type="button">Controls</button>
        </nav>
        <div class="controls-container">
          <div class="checkbox">
            <input
              checked={closeOnSelect.value}
              data-testid="closeOnSelect"
              id="closeOnSelect"
              onInput$={(_, element) => {
                closeOnSelect.value = element.checked
                machine.controller.value.updateProps({ closeOnSelect: element.checked })
              }}
              type="checkbox"
            />
            <label for="closeOnSelect">closeOnSelect</label>
          </div>
          <div class="checkbox">
            <input
              checked={loopFocus.value}
              data-testid="loopFocus"
              id="loopFocus"
              onInput$={(_, element) => {
                loopFocus.value = element.checked
                machine.controller.value.updateProps({ loopFocus: element.checked })
              }}
              type="checkbox"
            />
            <label for="loopFocus">loopFocus</label>
          </div>
        </div>
      </div>
    </>
  )
})
