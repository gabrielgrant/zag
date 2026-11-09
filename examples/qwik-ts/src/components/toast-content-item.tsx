import { component$, type NoSerialize } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as toast from "@zag-js/toast"

interface ToastContentItemProps {
  // toasts only exist client-side (created on interaction), so the actor and
  // parent service never need to survive serialization — they cross the
  // component$ boundary as NoSerialize values
  actor: NoSerialize<toast.Options<any>>
  index: number
  parent: NoSerialize<toast.GroupService>
}

/**
 * Mirrors the React example's `ToastItem` (content wrapper + optional action
 * trigger), which the toast/{deduplicated,promise,queued,undo-action} pages
 * render. `~/components/toast-item` keeps the older markup the stacked/overlap
 * pages (and their e2e spec) rely on.
 */
export const ToastContentItem = component$<ToastContentItemProps>((props) => {
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
      <div
        data-scope="toast"
        data-part="content"
        style={{ display: "grid", gap: "8px", width: "100%", paddingRight: "16px" }}
      >
        <div {...api.getTitleProps()}>
          {api.type === "loading" && "<...>"}
          {api.title}
        </div>
        <div {...api.getDescriptionProps()}>{api.description}</div>
        {props.actor?.action && <button {...api.getActionTriggerProps()}>{props.actor.action.label}</button>}
        <button {...api.getCloseTriggerProps()}>✕</button>
      </div>
      <span {...api.getGhostAfterProps()} />
    </div>
  )
})
