import { component$, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as splitter from "@zag-js/splitter"

export default component$(() => {
  const hideLeft = useSignal(false)
  const hideRight = useSignal(false)
  const id = useId()

  const service = useMachine(splitter.machine, () => ({
    id,
    panels: [
      !hideLeft.value && { id: "left", minSize: 20 },
      { id: "center", minSize: 30 },
      !hideRight.value && { id: "right", minSize: 20 },
    ].filter(Boolean) as splitter.PanelData[],
  }))

  const api = splitter.connect(service, normalizeProps)

  return (
    <main class="splitter">
      <pre>{JSON.stringify(api.getSizes())}</pre>
      <button onClick$={() => (hideLeft.value = !hideLeft.value)}>{hideLeft.value ? "Show Left" : "Hide Left"}</button>
      <button onClick$={() => (hideRight.value = !hideRight.value)}>
        {hideRight.value ? "Show Right" : "Hide Right"}
      </button>

      <div {...api.getRootProps()}>
        {!hideLeft.value && (
          <>
            <div {...api.getPanelProps({ id: "left" })}>
              <p>Left</p>
            </div>
            <div {...api.getResizeTriggerProps({ id: "left:center" })} />
          </>
        )}

        <div {...api.getPanelProps({ id: "center" })}>
          <p>Center</p>
        </div>

        {!hideRight.value && (
          <>
            <div {...api.getResizeTriggerProps({ id: "center:right" })} />
            <div {...api.getPanelProps({ id: "right" })}>
              <p>Right</p>
            </div>
          </>
        )}
      </div>
    </main>
  )
})
