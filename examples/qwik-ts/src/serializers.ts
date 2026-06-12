import {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
  parseAbsolute,
  parseDate,
  parseDateTime,
} from "@internationalized/date"
import { registerValueSerializer } from "@zag-js/qwik"
import { createCalendar } from "@internationalized/date"
import { IncompleteDate } from "@zag-js/date-input"
import { parse as parseColor, type Color } from "@zag-js/color-picker"

/**
 * Codecs for the class instances some machines keep in context. Importing
 * this module (on both server and client — page modules import it at the
 * top) registers them before any machine renders, letting the adapter store
 * the encoded form in resumable signals. See @zag-js/qwik value-serializer.
 */

registerValueSerializer({
  id: "i18n-date",
  match: (v): v is CalendarDate => v instanceof CalendarDate,
  encode: (v) => v.toString(),
  decode: (s) => parseDate(s as string),
})

registerValueSerializer({
  id: "i18n-datetime",
  match: (v): v is CalendarDateTime => v instanceof CalendarDateTime,
  encode: (v) => v.toString(),
  decode: (s) => parseDateTime(s as string),
})

registerValueSerializer({
  id: "i18n-zoned",
  match: (v): v is ZonedDateTime => v instanceof ZonedDateTime,
  encode: (v) => ({ iso: v.toAbsoluteString(), tz: v.timeZone }),
  decode: (d: any) => parseAbsolute(d.iso, d.tz),
})

registerValueSerializer({
  id: "incomplete-date",
  match: (v): v is IncompleteDate => v instanceof IncompleteDate,
  encode: (v) => ({
    cal: v.calendar.identifier,
    hc: v.hourCycle,
    f: [v.era, v.year, v.month, v.day, v.hour, v.dayPeriod, v.minute, v.second, v.millisecond, v.offset],
  }),
  decode: (d: any) => {
    const out = new IncompleteDate(createCalendar(d.cal), d.hc)
    ;[
      out.era,
      out.year,
      out.month,
      out.day,
      out.hour,
      out.dayPeriod,
      out.minute,
      out.second,
      out.millisecond,
      out.offset,
    ] = d.f
    return out
  },
})

registerValueSerializer({
  id: "color",
  match: (v): v is Color => typeof v === "object" && v !== null && "toFormat" in v && "toHexInt" in v,
  encode: (v) => v.toString("css"),
  decode: (s) => parseColor(s as string),
})

/**
 * The registrations above are module side effects; the qwik optimizer drops
 * unreferenced side-effect imports when extracting component$ chunks, so
 * pages call this (before useMachine) to keep the module in their graph.
 */
export function ensureSerializersRegistered() {}
