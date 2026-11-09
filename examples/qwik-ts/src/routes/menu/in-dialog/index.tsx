import { component$, useId } from "@qwik.dev/core"
import { isServer } from "@qwik.dev/core/build"
import * as dialog from "@zag-js/dialog"
import * as menu from "@zag-js/menu"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { menuData } from "@zag-js/shared"

const NestedMenu = component$(() => {
  const service = useMachine(menu.machine, { id: useId() })
  const root = menu.connect(service, normalizeProps)

  const subService = useMachine(menu.machine, { id: useId() })
  const sub = menu.connect(subService, normalizeProps)

  const sub2Service = useMachine(menu.machine, { id: useId() })
  const sub2 = menu.connect(sub2Service, normalizeProps)

  // see menu/nested: the parent/child wiring is idempotent, safe to repeat per render
  if (!isServer) {
    root.setChild(subService)
    sub.setParent(service)
    sub.setChild(sub2Service)
    sub2.setParent(subService)
  }

  const triggerItemProps = root.getTriggerItemProps(sub)
  const triggerItem2Props = sub.getTriggerItemProps(sub2)

  const [level1, level2, level3] = menuData

  return (
    <div>
      <button {...root.getTriggerProps()}>Options Menu</button>

      {/* rendered inline: Qwik has no portal */}
      {root.open && (
        <div {...root.getPositionerProps()}>
          <ul {...root.getContentProps()}>
            {level1.map((item) => {
              const props = item.trigger ? triggerItemProps : root.getItemProps({ value: item.value })
              return (
                <li key={item.value} {...props}>
                  {item.label}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {sub.open && (
        <div {...sub.getPositionerProps()}>
          <ul {...sub.getContentProps()}>
            {level2.map((item) => {
              const props = item.trigger ? triggerItem2Props : sub.getItemProps({ value: item.value })
              return (
                <li key={item.value} {...props}>
                  {item.label}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {sub2.open && (
        <div {...sub2.getPositionerProps()}>
          <ul {...sub2.getContentProps()}>
            {level3.map((item) => (
              <li key={item.value} {...sub2.getItemProps({ value: item.value })}>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})

export default component$(() => {
  const service = useMachine(dialog.machine, { id: useId() })
  const api = dialog.connect(service, normalizeProps)

  return (
    <div style={{ padding: "20px" }}>
      <button {...api.getTriggerProps()} data-testid="trigger-1">
        Open Dialog with Nested Menu
      </button>
      {api.open && (
        <>
          <div {...api.getBackdropProps()} />
          <div data-testid="positioner-1" {...api.getPositionerProps()}>
            <div {...api.getContentProps()}>
              <h2 {...api.getTitleProps()}>Dialog with Nested Menu</h2>
              <p {...api.getDescriptionProps()}>
                This dialog contains a menu with multiple nested submenus. The focus trap should include all menu
                levels, even though they are portalled.
              </p>
              <div style={{ marginTop: "20px" }}>
                <NestedMenu />
              </div>
              <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button {...api.getCloseTriggerProps()}>Close</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
})
