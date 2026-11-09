import { component$, useId, useSignal } from "@qwik.dev/core"
import * as menu from "@zag-js/menu"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

export default component$(() => {
  const secondaryRef = useSignal<HTMLButtonElement>()
  const finalRef = useSignal<HTMLButtonElement>()

  const id = useId()
  const contextId = useId()
  const noFocusId = useId()

  const service = useMachine(menu.machine, () => ({
    id,
    initialFocusEl: () => secondaryRef.value ?? null,
    finalFocusEl: () => finalRef.value ?? null,
  }))

  const contextService = useMachine(menu.machine, () => ({
    id: contextId,
    finalFocusEl: () => finalRef.value ?? null,
  }))

  const noFocusService = useMachine(menu.machine, {
    id: noFocusId,
    initialFocusEl: () => false,
  })

  const api = menu.connect(service, normalizeProps)
  const contextApi = menu.connect(contextService, normalizeProps)
  const noFocusApi = menu.connect(noFocusService, normalizeProps)

  return (
    <>
      <main>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button data-testid="trigger" {...api.getTriggerProps()}>
            Actions
          </button>
          <button data-testid="no-focus-trigger" {...noFocusApi.getTriggerProps()}>
            No initial focus
          </button>
          <button data-testid="final-focus" ref={finalRef}>
            Final focus target
          </button>
          <button data-testid="outside">Outside</button>
        </div>

        <div data-testid="context-trigger" {...contextApi.getContextTriggerProps()}>
          Right click here
        </div>

        {/* rendered inline: Qwik has no portal */}
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()}>
            <button data-testid="primary">Primary</button>
            <button data-testid="secondary" ref={secondaryRef}>
              Secondary
            </button>
            <div {...api.getItemProps({ value: "edit" })}>Edit</div>
            <div {...api.getItemProps({ value: "duplicate" })}>Duplicate</div>
          </div>
        </div>

        <div {...contextApi.getPositionerProps()}>
          <div data-testid="context-content" {...contextApi.getContentProps()}>
            <div {...contextApi.getItemProps({ value: "rename" })}>Rename</div>
            <div {...contextApi.getItemProps({ value: "delete" })}>Delete</div>
          </div>
        </div>

        <div {...noFocusApi.getPositionerProps()}>
          <div data-testid="no-focus-content" {...noFocusApi.getContentProps()}>
            <div {...noFocusApi.getItemProps({ value: "a" })}>A</div>
            <div {...noFocusApi.getItemProps({ value: "b" })}>B</div>
          </div>
        </div>
      </main>

      <Toolbar controls={null}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
