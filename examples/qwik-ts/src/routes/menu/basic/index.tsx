import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as menu from "@zag-js/menu"
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

  const parts = useConnectedParts$(() => menu.connect(machine.controller.value.service, normalizeProps), machine)
  const { api } = parts
  const trigger = bindPart$((api) => api.getTriggerProps(), parts)
  const positioner = bindPart$((api) => api.getPositionerProps(), parts)
  const content = bindPart$((api) => api.getContentProps(), parts)
  const edit = bindPart$((api) => api.getItemProps({ value: "edit" }), parts)
  const duplicate = bindPart$((api) => api.getItemProps({ value: "duplicate" }), parts)
  const remove = bindPart$((api) => api.getItemProps({ value: "delete" }), parts)
  const exportItem = bindPart$((api) => api.getItemProps({ value: "export" }), parts)
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
