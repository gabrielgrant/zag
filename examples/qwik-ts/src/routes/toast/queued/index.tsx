import { component$, noSerialize, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as toast from "@zag-js/toast"
import { ToastContentItem } from "~/components/toast-content-item"

// Module-level so the (QRL) click handlers and the group machine share it;
// created on first use rather than at module load (see tree-view/basic).
let store: toast.Store<string> | undefined
const getToaster = () =>
  (store ??= toast.createStore<string>({
    max: 2,
    duration: Infinity,
    placement: "bottom-end",
    overlap: false,
  }))

function createToasts() {
  const toaster = getToaster()
  toaster.create({ id: "first", title: "Toast 1", description: "Dismiss me to make room for the waiting toast." })
  toaster.create({ id: "second", title: "Toast 2", description: "Only two toasts can be visible at once." })
  toaster.create({ id: "waiting", title: "Toast 3", description: "I waited for a free slot.", meta: { updates: 0 } })
}

function updateWaiting() {
  for (let i = 0; i < 2; i++) {
    getToaster().update("waiting", (prev) => {
      const updates = (prev.meta?.updates ?? 0) + 1

      return {
        title: `Toast 3 (updated ${updates} times)`,
        meta: { updates },
      }
    })
  }
}

function dismissOldest() {
  const toaster = getToaster()
  const oldest = toaster.getVisibleToasts().at(-1)
  if (oldest?.id) toaster.dismiss(oldest.id)
}

export default component$(() => {
  const started = useSignal(false)
  const id = useId()
  const service = useMachine(toast.group.machine, () => ({ id, store: getToaster() }))
  const api = toast.group.connect(service, normalizeProps)

  return (
    <main style={{ display: "grid", alignContent: "start", gap: "24px", maxWidth: "640px" }}>
      <h1>Queued toasts</h1>
      <p>Show three persistent toasts with a visible limit of two. The third waits until a visible toast closes.</p>

      <ol>
        <li>Create three toasts. Only Toast 1 and Toast 2 should appear.</li>
        <li>Update the waiting toast. Each click applies two consecutive updates without showing it.</li>
        <li>Dismiss the oldest visible toast. Toast 3 should appear with its latest update count.</li>
      </ol>

      <p>
        To test cancellation, reset, create three toasts, and dismiss the waiting toast before closing the visible ones.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button
          disabled={started.value}
          onClick$={() => {
            createToasts()
            started.value = true
          }}
        >
          Create three toasts
        </button>
        <button disabled={!started.value} onClick$={() => updateWaiting()}>
          Update waiting toast
        </button>
        <button disabled={!started.value} onClick$={() => getToaster().dismiss("waiting")}>
          Dismiss waiting toast
        </button>
        <button disabled={!started.value} onClick$={() => dismissOldest()}>
          Dismiss oldest visible toast
        </button>
        <button
          onClick$={() => {
            getToaster().remove()
            started.value = false
          }}
        >
          Reset
        </button>
      </div>

      <div {...api.getGroupProps()}>
        {api.getToasts().map((actor, index) => (
          <ToastContentItem key={actor.id} actor={noSerialize(actor)} index={index} parent={noSerialize(service)} />
        ))}
      </div>
    </main>
  )
})
