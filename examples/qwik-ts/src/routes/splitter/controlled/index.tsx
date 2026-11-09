import { component$, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as splitter from "@zag-js/splitter"

export default component$(() => {
  const size = useSignal<number[]>([25, 50, 25])
  const id = useId()

  const service = useMachine(splitter.machine, () => ({
    id,
    panels: [
      { id: "left", minSize: 15 },
      { id: "center", minSize: 20 },
      { id: "right", minSize: 15 },
    ],
    size: size.value,
    onResize: (details) => {
      size.value = details.size
    },
  }))

  const api = splitter.connect(service, normalizeProps)

  return (
    <main class="splitter">
      <pre>{JSON.stringify(size.value)}</pre>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <button onClick$={() => (size.value = [25, 50, 25])}>Reset</button>
        <button onClick$={() => (size.value = [50, 25, 25])}>Left wide</button>
        <button onClick$={() => (size.value = [25, 25, 50])}>Right wide</button>
        <button onClick$={() => (size.value = [15, 70, 15])}>Center wide</button>
      </div>

      <div {...api.getRootProps()}>
        <div {...api.getPanelProps({ id: "left" })}>
          <p>Left</p>
        </div>
        <div {...api.getResizeTriggerProps({ id: "left:center" })} />
        <div {...api.getPanelProps({ id: "center" })}>
          <p>Center</p>
        </div>
        <div {...api.getResizeTriggerProps({ id: "center:right" })} />
        <div {...api.getPanelProps({ id: "right" })}>
          <p>Right</p>
        </div>
      </div>
    </main>
  )
})
