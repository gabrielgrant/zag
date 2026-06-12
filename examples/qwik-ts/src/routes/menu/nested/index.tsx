import { component$, useId } from "@qwik.dev/core"
import { isServer } from "@qwik.dev/core/build"
import * as menu from "@zag-js/menu"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { menuData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

export default component$(() => {
  const service = useMachine(menu.machine, { id: useId() })
  const root = menu.connect(service, normalizeProps)

  const subService = useMachine(menu.machine, { id: useId() })
  const sub = menu.connect(subService, normalizeProps)

  const sub2Service = useMachine(menu.machine, { id: useId() })
  const sub2 = menu.connect(sub2Service, normalizeProps)

  // parent/child wiring sends ref-storing events; pre-start they are buffered
  // and replayed, post-start they are idempotent — safe to repeat per render
  // (task closures can't capture the non-serializable services)
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
    <>
      <main>
        <div>
          <button data-testid="trigger" {...root.getTriggerProps()}>
            Click me
          </button>

          <div {...root.getPositionerProps()}>
            <ul data-testid="menu" {...root.getContentProps()}>
              {level1.map((item) => {
                const props = item.trigger ? triggerItemProps : root.getItemProps({ value: item.value })
                return (
                  <li key={item.value} data-testid={item.value} {...props}>
                    {item.label}
                  </li>
                )
              })}
            </ul>
          </div>

          <div {...sub.getPositionerProps()}>
            <ul data-testid="more-tools-submenu" {...sub.getContentProps()}>
              {level2.map((item) => {
                const props = item.trigger ? triggerItem2Props : sub.getItemProps({ value: item.value })
                return (
                  <li key={item.value} data-testid={item.value} {...props}>
                    {item.label}
                  </li>
                )
              })}
            </ul>
          </div>

          <div {...sub2.getPositionerProps()}>
            <ul data-testid="open-nested-submenu" {...sub2.getContentProps()}>
              {level3.map((item) => (
                <li key={item.value} data-testid={item.value} {...sub2.getItemProps({ value: item.value })}>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <Toolbar controls={null}>
        <StateVisualizer state={service} label="Root Machine" />
        <StateVisualizer state={subService} label="Sub Machine" />
        <StateVisualizer state={sub2Service} label="Sub2 Machine" />
      </Toolbar>
    </>
  )
})
