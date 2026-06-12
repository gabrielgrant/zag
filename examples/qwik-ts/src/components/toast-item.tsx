import { component$, type NoSerialize } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as toast from "@zag-js/toast"

interface ToastItemProps {
  // toasts only exist client-side (created on interaction), so the actor and
  // parent service never need to survive serialization — they cross the
  // component$ boundary as NoSerialize values
  actor: NoSerialize<toast.Options<any>>
  index: number
  parent: NoSerialize<toast.GroupService>
}

export const ToastItem = component$<ToastItemProps>((props) => {
  const service = useMachine(toast.machine, () => ({
    ...props.actor!,
    index: props.index,
    parent: props.parent!,
  }))
  const api = toast.connect(service, normalizeProps)

  return (
    <div {...api.getRootProps()}>
      <span {...api.getGhostBeforeProps()} />
      <div data-scope="toast" data-part="progressbar" />
      <div {...api.getTitleProps()}>
        {api.type === "loading" && "<...>"}
        {api.title} {api.type}
      </div>
      <div {...api.getDescriptionProps()}>{api.description}</div>
      <button {...api.getCloseTriggerProps()}>✕</button>
      <span {...api.getGhostAfterProps()} />
    </div>
  )
})
