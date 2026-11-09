import { component$, useId, useSignal } from "@qwik.dev/core"
import { ensureSerializersRegistered } from "~/serializers"
import * as datePicker from "@zag-js/date-picker"
import { normalizeProps, useMachine } from "@zag-js/qwik"

export default component$(() => {
  ensureSerializersRegistered()
  const id = useId()
  const nextFieldRef = useSignal<HTMLInputElement>()
  const service = useMachine(
    datePicker.machine,
    () =>
      ({
        id,
        locale: "en",
        onValueChange() {
          nextFieldRef.value?.focus()
        },
      }) as datePicker.Props,
  )
  const api = datePicker.connect(service, normalizeProps)
  return (
    <main class="date-picker">
      <div {...api.getControlProps()}>
        <input {...api.getInputProps()} />
        <button {...api.getTriggerProps()}>🗓</button>
      </div>
      <input ref={nextFieldRef} data-testid="next-field" placeholder="Next field" />
      <div {...api.getPositionerProps()}>
        <div {...api.getContentProps()}>
          <table {...api.getTableProps({ view: "day" })}>
            <tbody {...api.getTableBodyProps({ view: "day" })}>
              {api.weeks.map((week, i) => (
                <tr key={i} {...api.getTableRowProps({ view: "day" })}>
                  {week.map((value, j) => (
                    <td key={j} {...api.getDayTableCellProps({ value })}>
                      <div {...api.getDayTableCellTriggerProps({ value })}>{value.day}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
})
