import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as accordion from "@zag-js/accordion"
import { accordionControls, accordionData } from "@zag-js/shared"
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

interface AccordionItemProps {
  label: string
  machine: QwikMachineSignal<any>
  value: string
}

const AccordionItem = component$<AccordionItemProps>(({ label, machine, value }) => {
  const parts = useConnectedParts$(() => accordion.connect(machine.controller.value.service, normalizeProps), machine)
  const item = bindPart$((api) => api.getItemProps({ value }), parts)
  const trigger = bindPart$((api) => api.getItemTriggerProps({ value }), parts)
  const indicator = bindPart$((api) => api.getItemIndicatorProps({ value }), parts)
  const content = bindPart$((api) => api.getItemContentProps({ value }), parts)

  return (
    <div ref={item.ref} {...item.props}>
      <h3>
        <button data-testid={`${value}:trigger`} ref={trigger.ref} {...trigger.props}>
          {label}
          <span ref={indicator.ref} {...indicator.props}>
            &gt;
          </span>
        </button>
      </h3>
      <div data-testid={`${value}:content`} ref={content.ref} {...content.props}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </div>
    </div>
  )
})

export default component$(() => {
  const id = useId()
  const controls = useControls(accordionControls)
  const machine = useMachine$(() =>
    createMachineSerializer(accordion.machine, {
      props: () => ({
        id,
        ...controls.context.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => accordion.connect(machine.controller.value.service, normalizeProps), machine)
  const root = bindPart$((api) => api.getRootProps(), parts)

  return (
    <>
      <main class="accordion">
        <div ref={root.ref} {...root.props}>
          {accordionData.map((item) => (
            <AccordionItem key={item.id} label={item.label} machine={machine} value={item.id} />
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
  title: "Accordion | Zag Qwik Examples",
}
