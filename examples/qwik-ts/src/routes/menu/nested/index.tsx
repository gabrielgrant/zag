import { component$, useId, useVisibleTask$ } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as menu from "@zag-js/menu"
import { menuData } from "@zag-js/shared"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  type ConnectedParts,
  type QwikMachineSignal,
} from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

type MenuItem = (typeof menuData)[number][number]
type MenuMachine = QwikMachineSignal<any>
type MenuParts = ConnectedParts<any, ReturnType<typeof menu.connect>>

interface NestedMenuItemProps {
  childMachine?: MenuMachine
  item: MenuItem
  parts: MenuParts
}

const NestedMenuItem = component$<NestedMenuItemProps>(({ childMachine, item, parts }) => {
  const itemPart = bindPart$((api) => {
    if (!item.trigger || !childMachine) {
      return api.getItemProps({ value: item.value })
    }

    const childApi = menu.connect(childMachine.controller.value.service, normalizeProps)
    return api.getTriggerItemProps(childApi)
  }, parts)

  return (
    <li data-testid={item.value} key={item.value} ref={itemPart.ref} {...itemPart.props}>
      {item.label}
    </li>
  )
})

export default component$(() => {
  const rootId = useId()
  const subId = useId()
  const sub2Id = useId()

  const rootMachine = useMachine$(() =>
    createMachineSerializer(menu.machine, {
      props: () => ({ id: rootId }),
    }),
  )

  const subMachine = useMachine$(() =>
    createMachineSerializer(menu.machine, {
      props: () => ({ id: subId }),
    }),
  )

  const sub2Machine = useMachine$(() =>
    createMachineSerializer(menu.machine, {
      props: () => ({ id: sub2Id }),
    }),
  )

  const rootParts = useConnectedParts$(
    () => menu.connect(rootMachine.controller.value.service, normalizeProps),
    rootMachine,
  )
  const subParts = useConnectedParts$(
    () => menu.connect(subMachine.controller.value.service, normalizeProps),
    subMachine,
  )
  const sub2Parts = useConnectedParts$(
    () => menu.connect(sub2Machine.controller.value.service, normalizeProps),
    sub2Machine,
  )

  useVisibleTask$(
    () => {
      const rootApi = menu.connect(rootMachine.controller.value.service, normalizeProps)
      const subApi = menu.connect(subMachine.controller.value.service, normalizeProps)
      const sub2Api = menu.connect(sub2Machine.controller.value.service, normalizeProps)

      rootApi.setChild(subMachine.controller.value.service)
      subApi.setParent(rootMachine.controller.value.service)
      subApi.setChild(sub2Machine.controller.value.service)
      sub2Api.setParent(subMachine.controller.value.service)
    },
    { strategy: "document-ready" },
  )

  const rootTrigger = bindPart$((api) => api.getTriggerProps(), rootParts)
  const rootPositioner = bindPart$((api) => api.getPositionerProps(), rootParts)
  const rootContent = bindPart$((api) => api.getContentProps(), rootParts)

  const subPositioner = bindPart$((api) => api.getPositionerProps(), subParts)
  const subContent = bindPart$((api) => api.getContentProps(), subParts)

  const sub2Positioner = bindPart$((api) => api.getPositionerProps(), sub2Parts)
  const sub2Content = bindPart$((api) => api.getContentProps(), sub2Parts)

  const [level1, level2, level3] = menuData

  return (
    <>
      <main>
        <div>
          <button data-testid="trigger" ref={rootTrigger.ref} {...rootTrigger.props}>
            Click me
          </button>

          <div ref={rootPositioner.ref} {...rootPositioner.props}>
            <ul data-testid="menu" ref={rootContent.ref} {...rootContent.props}>
              {level1.map((item) => (
                <NestedMenuItem
                  childMachine={item.trigger ? subMachine : undefined}
                  item={item}
                  key={item.value}
                  parts={rootParts}
                />
              ))}
            </ul>
          </div>

          <div ref={subPositioner.ref} {...subPositioner.props}>
            <ul data-testid="more-tools-submenu" ref={subContent.ref} {...subContent.props}>
              {level2.map((item) => (
                <NestedMenuItem
                  childMachine={item.trigger ? sub2Machine : undefined}
                  item={item}
                  key={item.value}
                  parts={subParts}
                />
              ))}
            </ul>
          </div>

          <div ref={sub2Positioner.ref} {...sub2Positioner.props}>
            <ul data-testid="open-nested-submenu" ref={sub2Content.ref} {...sub2Content.props}>
              {level3.map((item) => (
                <NestedMenuItem item={item} key={item.value} parts={sub2Parts} />
              ))}
            </ul>
          </div>
        </div>
      </main>

      <Toolbar>
        <StateVisualizer controller={rootMachine.controller} revision={rootMachine.revision} />
        <StateVisualizer controller={subMachine.controller} revision={subMachine.revision} />
        <StateVisualizer controller={sub2Machine.controller} revision={sub2Machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Menu Nested | Zag Qwik Examples",
}
