import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as menu from "@zag-js/menu"
import { bindPart$, createMachineSerializer, normalizeProps, useConnectedParts$, useMachine$ } from "@zag-js/qwik"
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
  const machine = useMachine$(() =>
    createMachineSerializer(menu.machine, {
      props: () => ({
        id,
        onSelect: console.log,
      }),
    }),
  )

  const parts = useConnectedParts$(() => menu.connect(machine.controller.value.service, normalizeProps), machine)
  const contextTrigger = bindPart$((api) => api.getContextTriggerProps(), parts)
  const positioner = bindPart$((api) => api.getPositionerProps(), parts)
  const content = bindPart$((api) => api.getContentProps(), parts)
  const edit = bindPart$((api) => api.getItemProps({ value: "edit" }), parts)
  const duplicate = bindPart$((api) => api.getItemProps({ value: "duplicate" }), parts)
  const remove = bindPart$((api) => api.getItemProps({ value: "delete" }), parts)
  const exportItem = bindPart$((api) => api.getItemProps({ value: "export" }), parts)
  const items = [edit, duplicate, remove, exportItem]

  return (
    <>
      <main class="context-menu">
        <div ref={contextTrigger.ref} {...contextTrigger.props}>
          Right Click here
        </div>
        <div ref={positioner.ref} {...positioner.props}>
          <ul ref={content.ref} {...content.props}>
            {menuItems.map((item, index) => (
              <li key={item.value} ref={items[index].ref} {...items[index].props}>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Toolbar>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Context Menu | Zag Qwik Examples",
}
