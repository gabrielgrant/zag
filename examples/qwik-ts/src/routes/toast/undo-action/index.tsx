import { component$, noSerialize, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as toast from "@zag-js/toast"
import { ToastContentItem } from "~/components/toast-content-item"

// Module-level so the (QRL) click handlers and the group machine share it;
// created on first use rather than at module load (see tree-view/basic).
let store: toast.Store<string> | undefined
const getToaster = () => (store ??= toast.createStore<string>({ placement: "bottom-end", duration: 10000 }))

export default component$(() => {
  const saved = useSignal(true)
  const id = useId()
  const service = useMachine(toast.group.machine, () => ({ id, store: getToaster() }))
  const api = toast.group.connect(service, normalizeProps)

  return (
    <main style={{ display: "grid", alignContent: "start", gap: "24px", maxWidth: "640px" }}>
      <h1>Undo action</h1>
      <p>Remove a bookmark, then use Undo in the notification to restore it.</p>
      <section>
        <h2>Designing accessible notifications</h2>
        <p role="status">{saved.value ? "Saved to reading list" : "Removed from reading list"}</p>
        <button
          disabled={!saved.value}
          onClick$={() => {
            saved.value = false
            getToaster().create({
              title: "Bookmark removed",
              description: "Undo to put it back in your reading list.",
              action: {
                label: "Undo",
                onClick() {
                  saved.value = true
                  getToaster().create({ title: "Bookmark restored", type: "success" })
                },
              },
            })
          }}
        >
          Remove bookmark
        </button>
      </section>
      <div {...api.getGroupProps()}>
        {api.getToasts().map((actor, index) => (
          <ToastContentItem key={actor.id} actor={noSerialize(actor)} index={index} parent={noSerialize(service)} />
        ))}
      </div>
    </main>
  )
})
