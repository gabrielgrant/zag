import { component$, useId } from "@qwik.dev/core"
import * as dialog from "@zag-js/dialog"
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
  const service = useMachine(dialog.machine, { id: useId() })
  const api = dialog.connect(service, normalizeProps)

  return (
    <div style={{ padding: "20px" }}>
      <button {...api.getTriggerProps()} data-testid="trigger-1">
        Open Dialog
      </button>
      {api.open && (
        <>
          <div {...api.getBackdropProps()} />
          <div data-testid="positioner-1" {...api.getPositionerProps()}>
            <div {...api.getContentProps()}>
              <h2 {...api.getTitleProps()}>Edit profile</h2>
              <p {...api.getDescriptionProps()}>Make changes to your profile here. Click save when you are done.</p>
              <Select />
            </div>
          </div>
        </>
      )}
    </div>
  )
})
