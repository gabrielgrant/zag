import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as tabs from "@zag-js/tabs"
import { tabsControls, tabsData } from "@zag-js/shared"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  type QwikMachineSignal,
} from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

interface TabTriggerProps {
  label: string
  machine: QwikMachineSignal<any>
  value: string
}

const TabTrigger = component$<TabTriggerProps>(({ label, machine, value }) => {
  const parts = useConnectedParts$(() => tabs.connect(machine.controller.value.service, normalizeProps), machine)
  const trigger = bindPart$((api) => api.getTriggerProps({ value }), parts)

  return (
    <button data-testid={`${value}-tab`} ref={trigger.ref} {...trigger.props}>
      {label}
    </button>
  )
})

interface TabContentProps {
  content: string
  machine: QwikMachineSignal<any>
  value: string
}

const TabContent = component$<TabContentProps>(({ content, machine, value }) => {
  const parts = useConnectedParts$(() => tabs.connect(machine.controller.value.service, normalizeProps), machine)
  const panel = bindPart$((api) => api.getContentProps({ value }), parts)

  return (
    <div data-testid={`${value}-tab-panel`} ref={panel.ref} {...panel.props}>
      <p>{content}</p>
      {value === "agnes" && <input placeholder="Agnes" />}
    </div>
  )
})

export default component$(() => {
  const id = useId()
  const controls = useControls(tabsControls)
  const machine = useMachine$(() =>
    createMachineSerializer(tabs.machine, {
      props: () => ({
        id,
        defaultValue: "nils",
        ...controls.context.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => tabs.connect(machine.controller.value.service, normalizeProps), machine)
  const root = bindPart$((api) => api.getRootProps(), parts)
  const indicator = bindPart$((api) => api.getIndicatorProps(), parts)
  const list = bindPart$((api) => api.getListProps(), parts)

  return (
    <>
      <main class="tabs">
        <div ref={root.ref} {...root.props}>
          <div ref={indicator.ref} {...indicator.props} />
          <div ref={list.ref} {...list.props}>
            {tabsData.map((item) => (
              <TabTrigger key={item.id} label={item.label} machine={machine} value={item.id} />
            ))}
          </div>

          {tabsData.map((item) => (
            <TabContent key={item.id} content={item.content} machine={machine} value={item.id} />
          ))}
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
  title: "Tabs | Zag Qwik Examples",
}
