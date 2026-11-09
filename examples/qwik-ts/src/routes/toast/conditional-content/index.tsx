import { component$, noSerialize, useId, useSignal, useVisibleTask$, type NoSerialize } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as toast from "@zag-js/toast"

// Module-level so the (QRL) click handler and the group machine share it;
// created on first use rather than at module load (see tree-view/basic).
let store: toast.Store<string> | undefined
const getStore = () => (store ??= toast.createStore<string>({ duration: Infinity }))

interface ConditionalToastProps {
  actor: NoSerialize<toast.Options<string>>
  parent: NoSerialize<toast.GroupService>
  index: number
  showTitle: boolean
  showDescription: boolean
}

const ConditionalToast = component$<ConditionalToastProps>((props) => {
  const service = useMachine(toast.machine, () => ({
    ...props.actor!,
    parent: props.parent!,
    index: props.index,
  }))
  const api = toast.connect(service, normalizeProps)

  return (
    <div {...api.getRootProps()}>
      <div style={{ flex: 1 }}>
        <p>Your draft is ready.</p>
        {props.showTitle && <div {...api.getTitleProps()}>{api.title}</div>}
        {props.showDescription && <div {...api.getDescriptionProps()}>{api.description}</div>}
      </div>
      <button {...api.getCloseTriggerProps()}>✕</button>
    </div>
  )
})

export default component$(() => {
  const ready = useSignal(false)
  const showTitle = useSignal(false)
  const showDescription = useSignal(false)
  const id = useId()
  const service = useMachine(toast.group.machine, () => ({ id, store: getStore() }))
  const api = toast.group.connect(service, normalizeProps)

  useVisibleTask$(
    () => {
      ready.value = true
    },
    { strategy: "document-ready" },
  )

  return (
    <main>
      <h1>Conditional title and description</h1>
      <p>Toggle the optional title and description before or after creating a toast.</p>

      <fieldset
        disabled={!ready.value}
        style={{ display: "flex", alignItems: "center", gap: "16px", border: 0, padding: 0 }}
      >
        <label>
          <input
            type="checkbox"
            checked={showTitle.value}
            onChange$={(_, el) => {
              showTitle.value = el.checked
            }}
          />
          Show title
        </label>
        <label>
          <input
            type="checkbox"
            checked={showDescription.value}
            onChange$={(_, el) => {
              showDescription.value = el.checked
            }}
          />
          Show description
        </label>
        <button
          onClick$={() =>
            getStore().create({ id: "draft", title: "Draft saved", description: "All changes are up to date." })
          }
        >
          Create toast
        </button>
      </fieldset>

      <div {...api.getGroupProps()}>
        {api.getToasts().map((actor, index) => (
          <ConditionalToast
            key={actor.id}
            actor={noSerialize(actor)}
            parent={noSerialize(service)}
            index={index}
            showTitle={showTitle.value}
            showDescription={showDescription.value}
          />
        ))}
      </div>
    </main>
  )
})
