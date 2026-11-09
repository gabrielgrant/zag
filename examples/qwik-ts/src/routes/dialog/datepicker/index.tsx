import { component$, Slot, useId } from "@qwik.dev/core"
import * as datePicker from "@zag-js/date-picker"
import * as dialog from "@zag-js/dialog"
import { normalizeProps, useMachine } from "@zag-js/qwik"
import { ensureSerializersRegistered } from "~/serializers"

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

const DatePicker = component$(() => {
  ensureSerializersRegistered()
  const service = useMachine(datePicker.machine, {
    id: useId(),
    locale: "en",
    selectionMode: "single",
  })

  const api = datePicker.connect(service, normalizeProps)

  return (
    <div>
      <div {...api.getControlProps()}>
        <input {...api.getInputProps()} />
        <button {...api.getClearTriggerProps()}>❌</button>
        <button {...api.getTriggerProps()}>🗓</button>
      </div>

      <div {...api.getPositionerProps()}>
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
            <div {...api.getViewControlProps({ view: "year" })}>
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
    </div>
  )
})

const Dialog = component$(() => {
  const service = useMachine(dialog.machine, { id: useId() })
  const api = dialog.connect(service, normalizeProps)
  return (
    <>
      <button {...api.getTriggerProps()}>Open</button>
      {/* React mounts this only while open (`api.open && ...`). Here it stays mounted
          (the parts carry `hidden` while closed): a Qwik 2 rc.4 bug duplicates a
          component's whole output when a `<Slot />` first mounts in a conditional
          branch and the component re-renders a frame later (as the dialog does) */}
      <div {...api.getBackdropProps()} />
      <div {...api.getPositionerProps()}>
        <div {...api.getContentProps()}>
          <Slot />
          <button {...api.getCloseTriggerProps()}>
            <XIcon />
          </button>
        </div>
      </div>
    </>
  )
})

export default component$(() => {
  return (
    <main>
      <Dialog>
        <DatePicker />
        <Dialog>
          <DatePicker />
        </Dialog>
      </Dialog>
    </main>
  )
})
