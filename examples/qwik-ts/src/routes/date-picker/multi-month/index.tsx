import { component$, useId } from "@qwik.dev/core"
import * as datePicker from "@zag-js/date-picker"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { ensureSerializersRegistered } from "~/serializers"

export default component$(() => {
  ensureSerializersRegistered()
  const id = useId()

  const service = useMachine(datePicker.machine, () => ({
    id,
    locale: "en",
    selectionMode: "multiple" as const,
    minView: "month" as const,
    maxSelectedDates: 2,
  }))

  const api = datePicker.connect(service, normalizeProps)

  return (
    <>
      <main class="date-picker">
        <output class="date-output">
          <div>Selected: {api.valueAsString ?? "-"}</div>
        </output>

        <div {...api.getControlProps()}>
          <input {...api.getInputProps()} />
          <button {...api.getTriggerProps()}>🗓</button>
        </div>

        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()}>
            <div hidden={api.view !== "month"}>
              <div {...api.getViewControlProps({ view: "month" })}>
                <button {...api.getPrevTriggerProps({ view: "month" })}>Prev</button>
                <button {...api.getViewTriggerProps({ view: "month" })}>{api.visibleRange.start.year}</button>
                <button {...api.getNextTriggerProps({ view: "month" })}>Next</button>
              </div>

              <table {...api.getTableProps({ view: "month", columns: 4 })}>
                <tbody {...api.getTableBodyProps({ view: "month" })}>
                  {api.getMonthsGrid({ columns: 4, format: "short" }).map((months, row) => (
                    <tr key={row} {...api.getTableRowProps()}>
                      {months.map((month, index) => (
                        <td key={index} {...api.getMonthTableCellProps({ ...month, columns: 4 })}>
                          <div {...api.getMonthTableCellTriggerProps({ ...month, columns: 4 })}>{month.label}</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Toolbar viz>
        <StateVisualizer state={service} omit={["weeks"]} />
      </Toolbar>
    </>
  )
})
