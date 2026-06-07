import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as accordion from "@zag-js/accordion"
import { accordionData } from "@zag-js/shared"
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
  const collapsible = useSignal(false)
  const multiple = useSignal(false)
  const machine = useMachine$(() =>
    createMachineSerializer(accordion.machine, {
      props: () => ({
        id,
        collapsible: collapsible.value,
        multiple: multiple.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => accordion.connect(machine.controller.value.service, normalizeProps), machine)
  const root = bindPart$((api) => api.getRootProps(), parts)
  const collapsibleControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        collapsible.value = checked
        machine.controller.value.updateProps({ collapsible: checked })
      },
    }),
    machine,
  )
  const multipleControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        multiple.value = checked
        machine.controller.value.updateProps({ multiple: checked })
      },
    }),
    machine,
  )

  return (
    <>
      <main class="accordion">
        <div ref={root.ref} {...root.props}>
          {accordionData.map((item) => (
            <AccordionItem key={item.id} label={item.label} machine={machine} value={item.id} />
          ))}
        </div>
      </main>

      <Toolbar controls>
        <div q:slot="controls" class="controls-container">
          <div class="checkbox">
            <input
              checked={collapsible.value}
              data-testid="collapsible"
              id="accordion-collapsible"
              ref={collapsibleControl.ref}
              type="checkbox"
              {...collapsibleControl.props}
            />
            <label for="accordion-collapsible">collapsible</label>
          </div>
          <div class="checkbox">
            <input
              checked={multiple.value}
              data-testid="multiple"
              id="accordion-multiple"
              ref={multipleControl.ref}
              type="checkbox"
              {...multipleControl.props}
            />
            <label for="accordion-multiple">multiple</label>
          </div>
        </div>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Accordion | Zag Qwik Examples",
}
