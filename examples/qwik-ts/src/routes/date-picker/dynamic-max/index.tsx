import { parseDate } from "@internationalized/date"
import { component$, useId, useSignal } from "@qwik.dev/core"
import { ensureSerializersRegistered } from "~/serializers"
import * as datePicker from "@zag-js/date-picker"
import { normalizeProps, useMachine } from "@zag-js/qwik"

export default component$(() => {
  ensureSerializersRegistered()
  const id = useId()
  // ISO strings: signals must hold serializable data (DateValue is a class)
  const selectedValue = useSignal<string[]>([])

  // Calculate max date based on the first selected date (start date)
  const getMaxDate = () => {
    const [start, end] = selectedValue.value.map((v) => parseDate(v)).sort((a, b) => a.compare(b))
    if (start && !end) return start.add({ days: 3 })
  }

  const service = useMachine(
    datePicker.machine,
    () =>
      ({
        id,
        locale: "en",
        selectionMode: "range",
        inline: true,
        max: getMaxDate(),
        onValueChange: (details) => {
          selectedValue.value = details.value.map((v) => v.toString())
        },
      }) as datePicker.Props,
  )

  const api = datePicker.connect(service, normalizeProps)

  return (
    <main class="date-picker">
      <output class="date-output">
        <div>Selected: {api.valueAsString ?? "-"}</div>
        <div>Focused: {api.focusedValueAsString}</div>
      </output>

      <div {...api.getRootProps()}>
        <div {...api.getContentProps()}>
          <div style={{ marginBottom: "20px" }}>
            <select {...api.getMonthSelectProps()}>
              {api.getMonths().map((month, i) => (
                <option key={i} value={month.value} disabled={month.disabled}>
                  {month.label}
                </option>
              ))}
            </select>

            <select {...api.getYearSelectProps()}>
              {api.getYears().map((year, i) => (
                <option key={i} value={year.value} disabled={year.disabled}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>

          <div hidden={api.view !== "day"}>
            <div {...api.getViewControlProps({ view: "day" })}>
              <button {...api.getPrevTriggerProps()}>Prev</button>
              <button {...api.getViewTriggerProps()}>{api.visibleRangeText.start}</button>
              <button {...api.getNextTriggerProps()}>Next</button>
            </div>

            <table {...api.getTableProps({ view: "day" })}>
              <thead {...api.getTableHeaderProps({ view: "day" })}>
                <tr {...api.getTableRowProps({ view: "day" })}>
                  {api.weekDays.map((day, i) => (
                    <th scope="col" key={i} aria-label={day.long}>
                      {day.narrow}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody {...api.getTableBodyProps({ view: "day" })}>
                {api.weeks.map((week, i) => (
                  <tr key={i} {...api.getTableRowProps({ view: "day" })}>
                    {week.map((value, i) => (
                      <td key={i} {...api.getDayTableCellProps({ value })}>
                        <div {...api.getDayTableCellTriggerProps({ value })}>{value.day}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: "40px" }}>
            <div hidden={api.view !== "month"} style={{ width: "100%" }}>
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

            <div hidden={api.view !== "year"} style={{ width: "100%" }}>
              <div {...api.getViewControlProps({ view: "year" })}>
                <button {...api.getPrevTriggerProps({ view: "year" })}>Prev</button>
                <span>
                  {api.getDecade().start} - {api.getDecade().end}
                </span>
                <button {...api.getNextTriggerProps({ view: "year" })}>Next</button>
              </div>

              <table {...api.getTableProps({ view: "year", columns: 4 })}>
                <tbody {...api.getTableBodyProps()}>
                  {api.getYearsGrid({ columns: 4 }).map((years, row) => (
                    <tr key={row} {...api.getTableRowProps({ view: "year" })}>
                      {years.map((year, index) => (
                        <td key={index} {...api.getYearTableCellProps({ ...year, columns: 4 })}>
                          <div {...api.getYearTableCellTriggerProps({ ...year, columns: 4 })}>{year.label}</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
})
