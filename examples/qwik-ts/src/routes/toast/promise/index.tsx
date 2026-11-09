import { component$, noSerialize, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as toast from "@zag-js/toast"
import { ToastContentItem } from "~/components/toast-content-item"

// Module-level so the (QRL) click handlers and the group machine share it;
// created on first use rather than at module load (see tree-view/basic).
let store: toast.Store | undefined
const getToaster = () => (store ??= toast.createStore({ placement: "bottom-end", overlap: false }))

function upload(options: { reject?: boolean; description?: string } = {}) {
  const toaster = getToaster()
  const request = new Promise<string>((resolve, reject) => {
    setTimeout(() => {
      if (options.reject) reject(new Error("The upload failed. Try again."))
      else resolve("photo.png")
    }, 1200)
  })

  const result = toaster.promise(request, {
    loading: { title: "Uploading photo…", description: "Please wait." },
    success: (name) => ({ title: "Upload complete", description: `${name} is ready.` }),
    error: (error) => ({ title: "Upload failed", description: (error as Error).message }),
  })

  if (options.description !== undefined && result?.id) {
    toaster.create({ id: result.id, description: options.description })
  }
}

export default component$(() => {
  const id = useId()
  const service = useMachine(toast.group.machine, () => ({ id, store: getToaster() }))
  const api = toast.group.connect(service, normalizeProps)

  return (
    <main style={{ display: "grid", alignContent: "start", gap: "24px", maxWidth: "640px" }}>
      <h1>Promise toasts</h1>
      <p>Show a loading toast while uploading, then update it with the result.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button onClick$={() => upload()}>Upload successfully</button>
        <button onClick$={() => upload({ description: "Sending photo.png…" })}>Upload with progress message</button>
        <button onClick$={() => upload({ reject: true })}>Fail upload</button>
        <button onClick$={() => getToaster().dismiss()}>Dismiss all</button>
      </div>
      <div {...api.getGroupProps()}>
        {api.getToasts().map((actor, index) => (
          <ToastContentItem key={actor.id} actor={noSerialize(actor)} index={index} parent={noSerialize(service)} />
        ))}
      </div>
    </main>
  )
})
