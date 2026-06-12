import { component$, useId } from "@qwik.dev/core"
import * as datePicker from "@zag-js/date-picker"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { datePickerControls } from "@zag-js/shared"
import { StateVisualizer } from "~/components/state-visualizer"
import { Toolbar } from "~/components/toolbar"
import { useControls } from "~/hooks/use-controls"
import { ensureSerializersRegistered } from "~/serializers"

export default component$(() => {
  ensureSerializersRegistered()
  const controls = useControls(datePickerControls)
  const id = useId()
  const tableId = useId()
  const tableId2 = useId()

  const service = useMachine(
    datePicker.machine,
    () =>
      ({
        id,
        name: "date[]",
        numOfMonths: 2,
        selectionMode: "range",
        ...controls.values(),
      }) as datePicker.Props,
  )

  const api = datePicker.connect(service, normalizeProps)
  const offset = api.getOffset({ months: 1 })

  return (
    <>
      <main class="date-picker">
        <div>
          <button>Outside Element</button>
        </div>
        <p>{`Visible range: ${api.visibleRangeText.formatted}`}</p>

        <output class="date-output">
          <div>Selected: {api.valueAsString.join(", ") ?? "-"}</div>
          <div>Focused: {api.focusedValueAsString}</div>
        </output>

        <div {...api.getControlProps()}>
          <input {...api.getInputProps({ index: 0 })} />
          <input {...api.getInputProps({ index: 1 })} />
          <button {...api.getClearTriggerProps()}>❌</button>
          <button {...api.getTriggerProps()}>🗓</button>
        </div>

        <button {...api.getPresetTriggerProps({ value: "last7Days" })}>Last 7 days</button>

        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()}>
            <div style={{ marginBottom: "20px" }}>
              <select {...api.getMonthSelectProps()}>
                {api.getMonths().map((month, i) => (
                  <option key={i} value={i + 1} disabled={month.disabled}>
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

            <div>
              <div {...api.getViewControlProps({ view: "year" })}>
                <button {...api.getPrevTriggerProps()}>Prev</button>

                <span>
                  {api.visibleRangeText.start} - {api.visibleRangeText.end}
                </span>

                <button {...api.getNextTriggerProps()}>Next</button>
              </div>

              <div style={{ display: "flex", gap: "24px" }}>
                <table {...api.getTableProps({ id: tableId })}>
                  <thead {...api.getTableHeaderProps()}>
                    <tr {...api.getTableRowProps()}>
                      {api.weekDays.map((day, i) => (
                        <th scope="col" key={i} aria-label={day.long}>
                          {day.narrow}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody {...api.getTableBodyProps()}>
                    {api.weeks.map((week, i) => (
                      <tr key={i} {...api.getTableRowProps()}>
                        {week.map((value, j) => (
                          <td key={j} {...api.getDayTableCellProps({ value })}>
                            <div {...api.getDayTableCellTriggerProps({ value })}>{value.day}</div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <table {...api.getTableProps({ id: tableId2 })}>
                  <thead {...api.getTableHeaderProps()}>
                    <tr {...api.getTableRowProps()}>
                      {api.weekDays.map((day, i) => (
                        <th scope="col" key={i} aria-label={day.long}>
                          {day.narrow}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody {...api.getTableBodyProps()}>
                    {offset.weeks.map((week, i) => (
                      <tr key={i} {...api.getTableRowProps()}>
                        {week.map((value, j) => (
                          <td key={j} {...api.getDayTableCellProps({ value, visibleRange: offset.visibleRange })}>
                            <div {...api.getDayTableCellTriggerProps({ value, visibleRange: offset.visibleRange })}>
                              {value.day}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ minWidth: "80px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <b>Presets</b>
                  <button {...api.getPresetTriggerProps({ value: "last3Days" })}>Last 3 Days</button>
                  <button {...api.getPresetTriggerProps({ value: "last7Days" })}>Last 7 Days</button>
                  <button {...api.getPresetTriggerProps({ value: "last14Days" })}>Last 14 Days</button>
                  <button {...api.getPresetTriggerProps({ value: "last30Days" })}>Last 30 Days</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Toolbar viz controls={controls.ref}>
        <StateVisualizer state={service} omit={["weeks"]} />
      </Toolbar>
    </>
  )
})
