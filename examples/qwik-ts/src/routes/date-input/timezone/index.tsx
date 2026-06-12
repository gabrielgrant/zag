import { parseZonedDateTime } from "@internationalized/date"
import { component$, useId, useSignal } from "@qwik.dev/core"
import * as dateInput from "@zag-js/date-input"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { ensureSerializersRegistered } from "~/serializers"

const timeZone = "America/Los_Angeles"

export default component$(() => {
  ensureSerializersRegistered()
  const id = useId()
  const hideTimeZone = useSignal(false)

  const service = useMachine(
    dateInput.machine,
    () =>
      ({
        id,
        locale: "en-US",
        granularity: "minute" as const,
        timeZone,
        hideTimeZone: hideTimeZone.value,
        defaultValue: [parseZonedDateTime("2025-02-03T08:45:00[America/Los_Angeles]")],
      }) as any,
  )

  const api = dateInput.connect(service, normalizeProps)

  return (
    <>
      <main class="date-input">
        <div {...api.getRootProps()}>
          <label {...api.getLabelProps()}>Meeting time</label>

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
          <div>Time zone: {timeZone}</div>
        </output>

        <label style={{ display: "block", marginTop: "12px" }}>
          <input
            type="checkbox"
            data-testid="hide-tz"
            checked={hideTimeZone.value}
            onInput$={(_e, el) => (hideTimeZone.value = el.checked)}
          />{" "}
          Hide time zone
        </label>
      </main>

      <Toolbar viz>
        <StateVisualizer state={service} />
      </Toolbar>
    </>
  )
})
