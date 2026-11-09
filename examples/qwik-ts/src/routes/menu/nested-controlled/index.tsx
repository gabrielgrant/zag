import { component$, useId, useSignal } from "@qwik.dev/core"
import { isServer } from "@qwik.dev/core/build"
import * as menu from "@zag-js/menu"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

const rootItems = [
  { label: "New File", value: "new-file" },
  { label: "Share →", value: "share" },
  { label: "Export →", value: "export" },
  { label: "Delete", value: "delete" },
]

const submenuItems: Record<string, { label: string; value: string }[]> = {
  share: [
    { label: "Email", value: "email" },
    { label: "Copy Link", value: "copy-link" },
  ],
  export: [
    { label: "PDF", value: "pdf" },
    { label: "PNG", value: "png" },
  ],
}

// called unconditionally, in a fixed order, from the route body
function useControlledMenu() {
  const open = useSignal(false)
  const id = useId()
  return useMachine(menu.machine, () => ({
    id,
    open: open.value,
    onOpenChange: (details: menu.OpenChangeDetails) => (open.value = details.open),
  }))
}

export default component$(() => {
  const rootService = useControlledMenu()
  const root = menu.connect(rootService, normalizeProps)

  const shareService = useControlledMenu()
  const share = menu.connect(shareService, normalizeProps)

  const exportService = useControlledMenu()
  const exportMenu = menu.connect(exportService, normalizeProps)

  const submenus = [
    { value: "share", service: shareService, api: share },
    { value: "export", service: exportService, api: exportMenu },
  ]

  // see menu/nested: the parent/child wiring is idempotent, safe to repeat per render
  if (!isServer) {
    submenus.forEach(({ service, api }) => {
      root.setChild(service)
      api.setParent(rootService)
    })
  }

  return (
    <>
      <main>
        <div>
          <button data-testid="trigger" {...root.getTriggerProps()}>
            Click me
          </button>

          {/* rendered inline: Qwik has no portal */}
          <div {...root.getPositionerProps()}>
            <ul data-testid="menu" {...root.getContentProps()}>
              {rootItems.map((item) => {
                const sub = submenus.find((s) => s.value === item.value)
                const props = sub ? root.getTriggerItemProps(sub.api) : root.getItemProps({ value: item.value })
                return (
                  <li key={item.value} data-testid={item.value} {...props}>
                    {item.label}
                  </li>
                )
              })}
            </ul>
          </div>

          {submenus.map(({ value, api }) => (
            <div key={value} {...api.getPositionerProps()}>
              <ul data-testid={`${value}-submenu`} {...api.getContentProps()}>
                {submenuItems[value].map((item) => (
                  <li key={item.value} data-testid={item.value} {...api.getItemProps({ value: item.value })}>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      <Toolbar controls={null}>
        <StateVisualizer state={rootService} label="Root Machine" />
        <StateVisualizer state={shareService} label="Share Machine" />
        <StateVisualizer state={exportService} label="Export Machine" />
      </Toolbar>
    </>
  )
})
