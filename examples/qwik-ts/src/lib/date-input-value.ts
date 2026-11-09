import { parseDate, parseDateTime, parseZonedDateTime, type DateValue } from "@internationalized/date"

/**
 * Qwik signals must hold serializable data, and `DateValue`s are class
 * instances. Pages that keep a controlled date value in page state store the
 * ISO strings instead and decode them when passing the value to the machine.
 */
export function encodeDateValues(values: DateValue[]): string[] {
  return values.map((value) => value.toString())
}

export function decodeDateValues(values: string[]): DateValue[] {
  return values.map((value) => {
    if (value.includes("[")) return parseZonedDateTime(value)
    if (value.includes("T")) return parseDateTime(value)
    return parseDate(value)
  })
}
