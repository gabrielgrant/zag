import { component$, useId } from "@qwik.dev/core"
import * as popover from "@zag-js/popover"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as select from "@zag-js/select"
import { selectData } from "@zag-js/shared"

interface Item {
  label: string
  value: string
}

const Select = component$(() => {
  const id = useId()
  const service = useMachine(
    select.machine as select.Machine<Item>,
    () =>
      ({
        collection: select.collection({ items: selectData }),
        id,
        name: "country",
      }) as select.Props<Item>,
  )

  const api = select.connect(service, normalizeProps)
  const triggerProps = api.getTriggerProps()

  return (
    <div {...api.getRootProps()}>
      <label {...api.getLabelProps()}>Label</label>
      <div {...api.getControlProps()}>
        {/* `mergeProps(..., { "aria-controls": !api.open ? null : undefined })` in the React example */}
        <button {...triggerProps} aria-controls={api.open ? triggerProps["aria-controls"] : undefined}>
          <span>{api.valueAsString || "Select option"}</span>
          <span>▼</span>
        </button>
        <button {...api.getClearTriggerProps()}>X</button>
      </div>
      {api.open && (
        <div {...api.getPositionerProps()}>
          <ul {...api.getContentProps()}>
            {selectData.map((item) => (
              <li key={item.value} {...api.getItemProps({ item })}>
                <span {...api.getItemTextProps({ item })}>{item.label}</span>
                <span {...api.getItemIndicatorProps({ item })}>✓</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})

export default component$(() => {
  const service = useMachine(popover.machine, {
    id: useId(),
    // the React example portals the content (`portalled: true`); here it renders
    // inline after the trigger (Qwik has no portal), so the machine's tab-order
    // logic must treat it as not portalled
    portalled: false,
    modal: false,
  })
  const api = popover.connect(service, normalizeProps)

  return (
    <div style={{ padding: "20px" }}>
      <button {...api.getTriggerProps()}>Open Popover</button>
      {api.open && (
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()}>
            <div {...api.getTitleProps()}>Select in Popover</div>
            <div>
              <Select />
            </div>
            <button {...api.getCloseTriggerProps()}>X</button>
          </div>
        </div>
      )}
    </div>
  )
})
