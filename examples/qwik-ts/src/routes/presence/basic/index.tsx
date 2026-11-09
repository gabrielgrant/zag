import { component$, useSignal } from "@qwik.dev/core"
import * as presence from "@zag-js/presence"
import { normalizeProps, useMachine } from "@zag-js/qwik"

export default component$(() => {
  const present = useSignal(false)
  const service = useMachine(presence.machine, () => ({
    present: present.value,
    onEnterComplete() {
      console.log("enter complete")
    },
    onExitComplete() {
      console.log("exit complete")
    },
  }))
  const api = presence.connect(service, normalizeProps)

  return (
    <main class="presence">
      <button onClick$={() => (present.value = !present.value)}>Toggle</button>
      {api.present && (
        <div
          ref={(node) => {
            api.setNode(node)
          }}
          data-scope="presence"
          data-state={api.skip ? undefined : present.value ? "open" : "closed"}
        >
          Content
        </div>
      )}
    </main>
  )
})
