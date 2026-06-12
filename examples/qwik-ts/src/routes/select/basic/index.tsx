import { component$, useId } from "@qwik.dev/core"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import * as select from "@zag-js/select"
import { selectControls, selectData } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"

interface Item {
  label: string
  value: string
}

export default component$(() => {
  const controls = useControls(selectControls)
  const id = useId()

  const service = useMachine(
    select.machine as select.Machine<Item>,
    () =>
      ({
        collection: select.collection({ items: selectData }),
        id,
        name: "country",
        ...controls.values(),
      }) as select.Props<Item>,
  )

  const api = select.connect(service, normalizeProps)

  return (
    <>
      <main class="select">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Label</label>
          {/* control */}
          <div {...api.getControlProps()}>
            <button {...api.getTriggerProps()}>
              <span>{api.valueAsString || "Select option"}</span>
              <span {...api.getIndicatorProps()}>▼</span>
            </button>
            <button {...api.getClearTriggerProps()}>X</button>
          </div>

          <form>
            {/* Hidden select */}
            <select {...api.getHiddenSelectProps()}>
              {api.empty && <option value="" />}
              {selectData.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </form>

          {/* UI select */}
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
        </div>
      </main>

      <Toolbar controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
