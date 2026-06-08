import { component$, useId } from "@qwik.dev/core"
import type { DocumentHead } from "@qwik.dev/router"
import * as collapsible from "@zag-js/collapsible"
import { bindPart$, createMachineSerializer, normalizeProps, useConnectedParts$, useMachine$ } from "@zag-js/qwik"
import { collapsibleControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const id = useId()
  const controls = useControls(collapsibleControls)
  const machine = useMachine$(() =>
    createMachineSerializer(collapsible.machine, {
      props: () => ({
        id,
        ...controls.context.value,
      }),
    }),
  )

  const parts = useConnectedParts$(() => collapsible.connect(machine.controller.value.service, normalizeProps), machine)
  const api = parts.api
  const root = bindPart$((api) => api.getRootProps(), parts)
  const trigger = bindPart$((api) => api.getTriggerProps(), parts)
  const indicator = bindPart$((api) => api.getIndicatorProps(), parts)
  const content = bindPart$((api) => api.getContentProps(), parts)

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
  title: "Collapsible | Zag Qwik Examples",
}
