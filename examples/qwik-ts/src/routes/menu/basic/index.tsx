import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as menu from "@zag-js/menu"
import { createMachineSerializer, normalizeProps, useMachine$, usePart$ } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

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
  const closeOnSelectControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        closeOnSelect.value = checked
        machine.controller.value.updateProps({ closeOnSelect: checked })
      },
    }),
    machine,
    {
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        closeOnSelect.value = checked
        machine.controller.value.updateProps({ closeOnSelect: checked })
      },
    },
  )
  const loopFocusControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        loopFocus.value = checked
        machine.controller.value.updateProps({ loopFocus: checked })
      },
    }),
    machine,
    {
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        loopFocus.value = checked
        machine.controller.value.updateProps({ loopFocus: checked })
      },
    },
  )
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
      <Toolbar controls>
        <div q:slot="controls" class="controls-container">
          <div class="checkbox">
            <input
              ref={closeOnSelectControl.ref}
              checked={closeOnSelect.value}
              data-testid="closeOnSelect"
              id="closeOnSelect"
              {...closeOnSelectControl.props}
              type="checkbox"
            />
            <label for="closeOnSelect">closeOnSelect</label>
          </div>
          <div class="checkbox">
            <input
              ref={loopFocusControl.ref}
              checked={loopFocus.value}
              data-testid="loopFocus"
              id="loopFocus"
              {...loopFocusControl.props}
              type="checkbox"
            />
            <label for="loopFocus">loopFocus</label>
          </div>
        </div>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Menu | Zag Qwik Examples",
}
