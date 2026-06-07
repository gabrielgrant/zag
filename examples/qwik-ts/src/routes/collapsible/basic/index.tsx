import { component$, useId, useSignal } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as collapsible from "@zag-js/collapsible"
import {
  bindPart$,
  createMachineSerializer,
  normalizeProps,
  useConnectedParts$,
  useMachine$,
  usePart$,
} from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

export default component$(() => {
  const id = useId()
  const disabled = useSignal(false)
  const dir = useSignal<"ltr" | "rtl">("ltr")
  const machine = useMachine$(() =>
    createMachineSerializer(collapsible.machine, {
      props: () => ({
        id,
        disabled: disabled.value,
        dir: dir.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => collapsible.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const root = bindPart$((api) => api.getRootProps(), parts)
  const trigger = bindPart$((api) => api.getTriggerProps(), parts)
  const indicator = bindPart$((api) => api.getIndicatorProps(), parts)
  const content = bindPart$((api) => api.getContentProps(), parts)
  const disabledControl = usePart$(
    () => ({
      onInput(event: Event) {
        const checked = (event.currentTarget as HTMLInputElement).checked
        disabled.value = checked
        machine.controller.value.updateProps({ disabled: checked })
      },
    }),
    machine,
  )
  const dirControl = usePart$(
    () => ({
      onInput(event: Event) {
        const value = (event.currentTarget as HTMLSelectElement).value as "ltr" | "rtl"
        dir.value = value
        machine.controller.value.updateProps({ dir: value })
      },
    }),
    machine,
  )

  return (
    <>
      <main class="collapsible">
        <div ref={root.ref} {...root.props}>
          <button ref={trigger.ref} {...trigger.props}>
            Collapsible Trigger
            <span ref={indicator.ref} {...indicator.props}>
              v
            </span>
          </button>
          <div ref={content.ref} {...content.props}>
            <p>
              Lorem dfd dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna sfsd. Ut enim ad minimdfd v eniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
              ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum. <a href="/collapsible">Some Link</a>
            </p>
          </div>
        </div>

        <div>
          <div>Toggle Controls</div>
          <button onClick$={() => api?.setOpen(true)} type="button">
            Open
          </button>
          <button onClick$={() => api?.setOpen(false)} type="button">
            Close
          </button>
        </div>
      </main>

      <Toolbar controls>
        <div q:slot="controls" class="controls-container">
          <div class="checkbox">
            <input
              checked={disabled.value}
              data-testid="disabled"
              id="collapsible-disabled"
              ref={disabledControl.ref}
              type="checkbox"
              {...disabledControl.props}
            />
            <label for="collapsible-disabled">disabled</label>
          </div>
          <div class="field">
            <label for="collapsible-dir">dir</label>
            <select data-testid="dir" id="collapsible-dir" ref={dirControl.ref} value={dir.value} {...dirControl.props}>
              <option value="ltr">ltr</option>
              <option value="rtl">rtl</option>
            </select>
          </div>
        </div>
        <StateVisualizer controller={machine.controller} revision={machine.revision} />
      </Toolbar>
    </>
  )
})

export const head: DocumentHead = {
  title: "Collapsible | Zag Qwik Examples",
}
