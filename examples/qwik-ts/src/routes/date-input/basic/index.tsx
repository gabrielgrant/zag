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
        ...controls.values(),
      }) as any,
  )

  const api = dateInput.connect(service, normalizeProps)

  return (
    <>
      <main class="date-input">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Date</label>

          <div {...api.getControlProps()}>
            <div {...api.getSegmentGroupProps()}>
              {api.getSegments().map((segment, i) => (
                <span key={i} {...api.getSegmentProps({ segment })}>
                  {segment.text}
                </span>
              ))}
            </div>
          </div>

          <input {...api.getHiddenInputProps()} />
        </div>

        <output class="date-output">
          <div>Selected: {api.valueAsString.join(", ") || "-"}</div>
          <div>Placeholder: {api.placeholderValue.toString()}</div>
          <div>Editing: {api.displayValues?.[0]?.toString() ?? "-"}</div>
        </output>
      </main>

      <Toolbar viz controls={controls.ref}>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
