import { component$, useId } from "@qwik.dev/core"
import { ensureSerializersRegistered } from "~/serializers"
import * as dateInput from "@zag-js/date-input"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"

import { PersianCalendar } from "@internationalized/date"

function createCalendar(identifier: string) {
  switch (identifier) {
    case "persian":
      return new PersianCalendar()
    default:
      throw new Error(`Unsupported calendar: ${identifier}`)
  }
}

export default component$(() => {
  ensureSerializersRegistered()
  const id = useId()
  const service = useMachine(
    dateInput.machine,
    () =>
      ({
        id,
        locale: "fa-IR",
        createCalendar,
      }) as dateInput.Props,
  )

  const api = dateInput.connect(service, normalizeProps)

  return (
    <>
      <main class="date-input">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>تاریخ</label>

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
        </output>
      </main>

      <Toolbar viz>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
