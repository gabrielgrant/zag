import { component$, useId } from "@qwik.dev/core"
import * as dateInput from "@zag-js/date-input"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { dateInputControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"
import { ensureSerializersRegistered } from "~/serializers"

export default component$(() => {
  ensureSerializersRegistered()
  const controls = useControls(dateInputControls)
  const id = useId()

  const service = useMachine(
    dateInput.machine,
    () =>
      ({
        id,
        selectionMode: "range",
        ...controls.values(),
      }) as any,
  )

  const api = dateInput.connect(service, normalizeProps)

  return (
    <>
      <main class="date-input">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Date Range</label>

          <div {...api.getControlProps()}>
            <div {...api.getSegmentGroupProps({ index: 0 })}>
              {api.getSegments({ index: 0 }).map((segment, i) => (
                <span key={i} {...api.getSegmentProps({ segment, index: 0 })}>
                  {segment.text}
                </span>
              ))}
            </div>

            <span> &ndash; </span>

            <div {...api.getSegmentGroupProps({ index: 1 })}>
              {api.getSegments({ index: 1 }).map((segment, i) => (
                <span key={i} {...api.getSegmentProps({ segment, index: 1 })}>
                  {segment.text}
                </span>
              ))}
            </div>
          </div>

          <input {...api.getHiddenInputProps({ index: 0 })} />
          <input {...api.getHiddenInputProps({ index: 1 })} />
        </div>

        <output class="date-output">
          <div>Selected: {api.valueAsString.join(" - ") || "-"}</div>
          <div>Placeholder: {api.placeholderValue.toString()}</div>
          {api.displayValues?.map((date, index) => (
            <div key={index}>
              Editing input {index + 1}: {date.toString() ?? "-"}
            </div>
          ))}
        </output>
      </main>

      <Toolbar viz controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
