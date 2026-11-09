import { component$, noSerialize, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as toast from "@zag-js/toast"
import { ToastContentItem } from "~/components/toast-content-item"

// Module-level so the (QRL) click handlers and the group machine share it;
// created on first use rather than at module load (see tree-view/basic).
let store: toast.Store<string> | undefined
const getToaster = () =>
  (store ??= toast.createStore<string>({ placement: "bottom-end", overlap: false, duration: Infinity }))

function saveDraft() {
  const toaster = getToaster()
  if (!toaster.isVisible("draft")) {
    toaster.create({ id: "draft", title: "Draft saved", description: "Saved 1 time.", meta: { saves: 1 } })
    return
  }

  toaster.update("draft", (prev) => {
    const saves = (prev.meta?.saves ?? 0) + 1

    return {
      description: `Saved ${saves} times.`,
      meta: { saves },
    }
  })
}

export default component$(() => {
  const id = useId()
  const service = useMachine(toast.group.machine, () => ({ id, store: getToaster() }))
  const api = toast.group.connect(service, normalizeProps)

  return (
    <main style={{ display: "grid", alignContent: "start", gap: "24px", maxWidth: "640px" }}>
      <h1>Deduplicated toasts</h1>
      <p>Repeated saves update one persistent toast. Close it, then save again to start a new count.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick$={() => saveDraft()}>Save draft</button>
        <button onClick$={() => getToaster().dismiss("draft")}>Dismiss draft</button>
      </div>
      <div {...api.getGroupProps()}>
        {api.getToasts().map((actor, index) => (
          <ToastContentItem key={actor.id} actor={noSerialize(actor)} index={index} parent={noSerialize(service)} />
        ))}
      </div>
    </main>
  )
})
