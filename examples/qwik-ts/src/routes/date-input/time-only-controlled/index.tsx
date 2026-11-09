import { component$, useId, useSignal } from "@qwik.dev/core"
import { ensureSerializersRegistered } from "~/serializers"
import { DateFormatter } from "@internationalized/date"
import * as dateInput from "@zag-js/date-input"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { decodeDateValues, encodeDateValues } from "~/lib/date-input-value"

const timeFormatter = new DateFormatter("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

export default component$(() => {
  ensureSerializersRegistered()
  const id = useId()
  // ISO strings: signals must hold serializable data (DateValue is a class)
  const value = useSignal<string[]>([])

  const service = useMachine(
    dateInput.machine,
    () =>
      ({
        id,
        locale: "en-US",
        granularity: "minute",
        hourCycle: 24,
        formatter: timeFormatter,
        value: decodeDateValues(value.value),
        onValueChange: (details) => {
          value.value = encodeDateValues(details.value)
        },
      }) as dateInput.Props,
  )

  const api = dateInput.connect(service, normalizeProps)

  return (
    <>
      <main class="date-input">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Time</label>

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
          <div>Controlled value: {api.valueAsString.join(", ") || "-"}</div>
        </output>
      </main>

      <Toolbar viz>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
