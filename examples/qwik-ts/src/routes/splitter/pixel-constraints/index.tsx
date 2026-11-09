import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as splitter from "@zag-js/splitter"

export default component$(() => {
  const id = useId()
  const service = useMachine(splitter.machine, {
    id,
    defaultSize: ["240px", "60vw"],
    panels: [
      { id: "sidebar", minSize: "240px", maxSize: "360px" },
      { id: "content", minSize: 20 },
    ],
  })

  const api = splitter.connect(service, normalizeProps)

  return (
    <main class="splitter">
      <pre>{JSON.stringify(api.getSizes())}</pre>
      <div {...api.getRootProps()}>
        <div {...api.getPanelProps({ id: "sidebar" })}>
          <p>Sidebar: 240px - 360px</p>
        </div>
        <div {...api.getResizeTriggerProps({ id: "sidebar:content" })} />
        <div {...api.getPanelProps({ id: "content" })}>
          <p>Content</p>
        </div>
      </div>
    </main>
  )
})
