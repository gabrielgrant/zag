import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as menu from "@zag-js/menu"
import { bindPart$, createMachineSerializer, normalizeProps, useConnectedParts$, useMachine$ } from "@zag-js/qwik"
import { menuControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

const menuItems = [
  { value: "edit", label: "Edit" },
  { value: "duplicate", label: "Duplicate" },
  { value: "delete", label: "Delete" },
  { value: "export", label: "Export..." },
]

export default component$(() => {
  const id = useId()
  const controls = useControls(menuControls)
  const machine = useMachine$(() =>
    createMachineSerializer(menu.machine, {
      props: () => ({
        id,
        ...controls.context.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => menu.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const indicatorProps = api?.getIndicatorProps?.() ?? {}
  const trigger = bindPart$((api) => api.getTriggerProps(), parts)
  const positioner = bindPart$((api) => api.getPositionerProps(), parts)
  const content = bindPart$((api) => api.getContentProps(), parts)
  const edit = bindPart$((api) => api.getItemProps({ value: "edit" }), parts)
  const duplicate = bindPart$((api) => api.getItemProps({ value: "duplicate" }), parts)
  const remove = bindPart$((api) => api.getItemProps({ value: "delete" }), parts)
  const exportItem = bindPart$((api) => api.getItemProps({ value: "export" }), parts)
  const items = [edit, duplicate, remove, exportItem]
  return (
    <>
      <main>
        <div>
          <button ref={trigger.ref} {...trigger.props}>
            Actions <span {...indicatorProps}>▾</span>
          </button>
          <div ref={positioner.ref} {...positioner.props}>
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
      <Toolbar
        controls={controls}
        onControlsChange$={(context) => {
          machine.controller.value.updateProps(context)
        }}
      >
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Menu | Zag Qwik Examples",
}
