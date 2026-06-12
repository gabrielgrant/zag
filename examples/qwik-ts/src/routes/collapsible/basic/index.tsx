import { component$, useId } from "@qwik.dev/core"
import * as collapsible from "@zag-js/collapsible"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { collapsibleControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

export default component$(() => {
  const controls = useControls(collapsibleControls)
  const id = useId()

  const service = useMachine(collapsible.machine, {
    ...controls.state,
    id,
  } as collapsible.Props)

  const api = collapsible.connect(service, normalizeProps)

  return (
    <>
      <main class="collapsible">
        <div {...api.getRootProps()}>
          <button {...api.getTriggerProps()}>
            Collapsible Trigger
            <div {...api.getIndicatorProps()}>{"▾"}</div>
          </button>
          <div {...api.getContentProps()}>
            <p>
              Lorem dfd dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna sfsd. Ut enim ad minimdfd v eniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
              ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum. <a href="#">Some Link</a>
            </p>
          </div>
        </div>

        <div>
          <div>Toggle Controls</div>
          {/* QRL handlers can't capture the non-serializable `api`; delegate
              through the trigger, which only acts when the state differs */}
          <button
            onClick$={() => {
              const el = document.querySelector<HTMLElement>(".collapsible [data-part=trigger][data-state=closed]")
              el?.click()
            }}
          >
            Open
          </button>
          <button
            onClick$={() => {
              const el = document.querySelector<HTMLElement>(".collapsible [data-part=trigger][data-state=open]")
              el?.click()
            }}
          >
            Close
          </button>
        </div>
      </main>

      <Toolbar controls={controls} viz>
        <StateVisualizer state={service} omit={["stylesRef"]} />
      </Toolbar>
    </>
  )
})
