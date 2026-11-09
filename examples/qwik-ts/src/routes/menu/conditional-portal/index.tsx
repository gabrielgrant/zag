import { component$, useId, useSignal } from "@qwik.dev/core"
import * as menu from "@zag-js/menu"
import { normalizeProps, useMachine } from "@zag-js/qwik"

// the consumer pattern from issue #3323: content stays mounted while closed and is
// re-parented into a portal when open, so a doomed node exists at layer-effect time.
// Qwik has no portal: the open content is rendered into a different container at the
// end of <main>, so the closed node is still destroyed and a new one created on open.
export default component$(() => {
  const log = useSignal<string[]>([])
  const id = useId()

  const service = useMachine(menu.machine, () => ({
    id,
    onSelect: ({ value }: menu.SelectionDetails) => (log.value = [...log.value, `select:${value}`]),
    onOpenChange: ({ open }: menu.OpenChangeDetails) => (log.value = [...log.value, `open:${open}`]),
  }))

  const api = menu.connect(service, normalizeProps)

  const content = () => (
    <div {...api.getPositionerProps()}>
      <ul {...api.getContentProps()}>
        <li {...api.getItemProps({ value: "edit" })}>Edit</li>
        <li {...api.getItemProps({ value: "duplicate" })}>Duplicate</li>
        <li {...api.getItemProps({ value: "delete" })}>Delete</li>
      </ul>
    </div>
  )

  return (
    <main>
      <div data-testid="open-state">{String(api.open)}</div>
      <div data-testid="log">{log.value.join(",")}</div>
      <button {...api.getTriggerProps()}>
        Actions <span {...api.getIndicatorProps()}>▾</span>
      </button>
      {!api.open && <div hidden>{content()}</div>}
      {api.open && <div data-portal="">{content()}</div>}
    </main>
  )
})
