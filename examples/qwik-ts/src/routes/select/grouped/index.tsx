import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as select from "@zag-js/select"
import { groupedData, selectControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

type Item = (typeof groupedData)[number]

export default component$(() => {
  const controls = useControls(selectControls)
  const id = useId()

  const service = useMachine(
    select.machine as select.Machine<Item>,
    () =>
      ({
        collection: select.collection({ items: groupedData, groupBy: (item) => item.type }),
        id,
        ...controls.values(),
      }) as select.Props<Item>,
  )

  const api = select.connect(service, normalizeProps)

  return (
    <>
      <main class="select">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Label</label>
          <div {...api.getControlProps()}>
            <button {...api.getTriggerProps()}>
              <span>{api.valueAsString || "Select option"}</span>
              <span {...api.getIndicatorProps()}>▼</span>
            </button>
            <button {...api.getClearTriggerProps()}>X</button>
          </div>

          <div {...api.getPositionerProps()}>
            <div {...api.getContentProps()}>
              {api.collection.group().map(([type, items]) => (
                <div key={type} {...api.getItemGroupProps({ id: type })}>
                  <div {...api.getItemGroupLabelProps({ htmlFor: type })}>{type}</div>
                  {items.map((item) => (
                    <div key={item.value} {...api.getItemProps({ item })}>
                      <span {...api.getItemTextProps({ item })}>{item.label}</span>
                      <span {...api.getItemIndicatorProps({ item })}>✓</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
