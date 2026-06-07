import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as tabs from "@zag-js/tabs"
import { tabsData } from "@zag-js/shared"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  usePart$,
  type QwikMachineSignal,
} from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

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
  const activationMode = useSignal<"manual" | "automatic">("automatic")
  const deselectable = useSignal(false)
  const loopFocus = useSignal(true)
  const machine = useMachine$(() =>
    createMachineSerializer(tabs.machine, {
      props: () => ({
        id,
        defaultValue: "nils",
        activationMode: activationMode.value,
        deselectable: deselectable.value,
        loopFocus: loopFocus.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => tabs.connect(machine.controller.value.service, normalizeProps), machine)
  const root = bindPart$((api) => api.getRootProps(), parts)
  const indicator = bindPart$((api) => api.getIndicatorProps(), parts)
  const list = bindPart$((api) => api.getListProps(), parts)
  const activationModeControl = usePart$(
    () => ({
      onInput(event: Event) {
        const value = (event.currentTarget as HTMLSelectElement).value as "manual" | "automatic"
        activationMode.value = value
        machine.controller.value.updateProps({ activationMode: value })
      },
    }),
    machine,
  )
  const deselectableControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        deselectable.value = checked
        machine.controller.value.updateProps({ deselectable: checked })
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

      <Toolbar controls>
        <div q:slot="controls" class="controls-container">
          <div class="field">
            <label for="tabs-activation-mode">activationMode</label>
            <select
              data-testid="activationMode"
              id="tabs-activation-mode"
              ref={activationModeControl.ref}
              value={activationMode.value}
              {...activationModeControl.props}
            >
              <option value="automatic">automatic</option>
              <option value="manual">manual</option>
            </select>
          </div>
          <div class="checkbox">
            <input
              checked={deselectable.value}
              data-testid="deselectable"
              id="tabs-deselectable"
              ref={deselectableControl.ref}
              type="checkbox"
              {...deselectableControl.props}
            />
            <label for="tabs-deselectable">deselectable</label>
          </div>
          <div class="checkbox">
            <input
              checked={loopFocus.value}
              data-testid="loopFocus"
              id="tabs-loop-focus"
              ref={loopFocusControl.ref}
              type="checkbox"
              {...loopFocusControl.props}
            />
            <label for="tabs-loop-focus">loopFocus</label>
          </div>
        </div>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Tabs | Zag Qwik Examples",
}
