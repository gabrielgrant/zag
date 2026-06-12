import { component$, noSerialize, useId, useSignal } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { toastControls } from "@zag-js/shared"
import * as toast from "@zag-js/toast"
import { Dialog } from "~/components/dialog"
import { StateVisualizer } from "~/components/state-visualizer"
import { ToastItem } from "~/components/toast-item"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

const toaster = toast.createStore({
  overlap: false,
  placement: "bottom",
  gap: 24,
})

export default component$(() => {
  const controls = useControls(toastControls)
  const id = useId()

  const service = useMachine(toast.group.machine, () => ({
    id,
    store: toaster,
    ...controls.values(),
  }))

  const api = toast.group.connect(service, normalizeProps)
  const lastId = useSignal<string>()

  return (
    <>
      <main>
        <Dialog />
        <div style={{ display: "flex", gap: "16px" }}>
          <button
            onClick$={() => {
              toaster.create({
                title: "Fetching data...",
                type: "loading",
              })
            }}
          >
            Notify (Loading)
          </button>
          <button
            onClick$={() => {
              lastId.value = toaster.create({
                title: "Ooops! Something was wrong",
                type: "error",
              })
            }}
          >
            Notify (Error)
          </button>
          <button
            onClick$={() => {
              if (!lastId.value) return
              toaster.update(lastId.value, {
                title: "Testing",
                type: "loading",
              })
            }}
          >
            Update Latest
          </button>
          <button
            class="toast-button"
            onClick$={() => {
              const promise = new Promise<{ name: string }>((resolve) => {
                setTimeout(() => {
                  resolve({ name: "Chakra" })
                }, 3000)
              })

              toaster.promise(promise, {
                loading: { title: "Creating toast..." },
                success: (data: { name: string }) => ({ title: `${data.name} toast added` }),
                error: { title: "Error" },
              })
            }}
          >
            Promise
          </button>
          <button
            onClick$={() => {
              toaster.create({
                type: "info",
                title: "Hello",
                description: "This is a description",
              })
            }}
          >
            Create (JSX)
          </button>

          <button onClick$={() => toaster.dismiss()}>Close all</button>
          <button onClick$={() => toaster.pause()}>Pause all</button>
          <button onClick$={() => toaster.resume()}>Resume all</button>
        </div>

        <div {...api.getGroupProps()}>
          {api.getToasts().map((actor, index) => (
            <ToastItem key={actor.id} actor={noSerialize(actor)} index={index} parent={noSerialize(service)} />
          ))}
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
