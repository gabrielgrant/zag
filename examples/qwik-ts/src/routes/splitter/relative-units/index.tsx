import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as splitter from "@zag-js/splitter"

export default component$(() => {
  const id = useId()
  const service = useMachine(splitter.machine, {
    id,
    orientation: "vertical",
    defaultSize: ["6rem", "60%", "4em"],
    panels: [
      { id: "header", minSize: "6rem", maxSize: "20vh" },
      { id: "body", minSize: "12rem" },
      { id: "footer", minSize: "4em", maxSize: "25vh" },
    ],
  })

  const api = splitter.connect(service, normalizeProps)

  return (
    <main class="splitter">
      <pre>{JSON.stringify(api.getSizes())}</pre>
      <div {...api.getRootProps()}>
        <div {...api.getPanelProps({ id: "header" })}>
          <p>Header: 6rem - 20vh</p>
        </div>
        <div {...api.getResizeTriggerProps({ id: "header:body" })} />
        <div {...api.getPanelProps({ id: "body" })}>
          <p>Body: min 12rem</p>
        </div>
        <div {...api.getResizeTriggerProps({ id: "body:footer" })} />
        <div {...api.getPanelProps({ id: "footer" })}>
          <p>Footer: 4em - 25vh</p>
        </div>
      </div>
    </main>
  )
})
