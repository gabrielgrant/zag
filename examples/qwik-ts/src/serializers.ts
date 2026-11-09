import { CalendarDate, CalendarDateTime, ZonedDateTime, createCalendar, parseAbsolute } from "@internationalized/date"
import { registerValueSerializer } from "@zag-js/qwik"
import { IncompleteDate } from "@zag-js/date-input"
import { parse as parseColor, type Color } from "@zag-js/color-picker"

/**
 * Codecs for the class instances some machines keep in context. Importing
 * this module (on both server and client — page modules import it at the
 * top) registers them before any machine renders, letting the adapter store
 * the encoded form in resumable signals. See @zag-js/qwik value-serializer.
 */

// Fields, not `toString()`: the ISO form is always Gregorian and has no era,
// so dates in other calendar systems would resume as Gregorian and 1 BC
// (ISO year 0000) would come back as 1 AD.
registerValueSerializer({
  id: "i18n-date",
  match: (v): v is CalendarDate => v instanceof CalendarDate,
  serialize: (v) => ({ cal: v.calendar.identifier, f: [v.era, v.year, v.month, v.day] }),
  deserialize: (d: any) => {
    const [era, year, month, day] = d.f
    return new CalendarDate(createCalendar(d.cal), era, year, month, day)
  },
})

registerValueSerializer({
  id: "i18n-datetime",
  match: (v): v is CalendarDateTime => v instanceof CalendarDateTime,
  serialize: (v) => ({
    cal: v.calendar.identifier,
    f: [v.era, v.year, v.month, v.day, v.hour, v.minute, v.second, v.millisecond],
  }),
  deserialize: (d: any) => {
    const [era, year, month, day, hour, minute, second, millisecond] = d.f
    return new CalendarDateTime(createCalendar(d.cal), era, year, month, day, hour, minute, second, millisecond)
  },
})

registerValueSerializer({
  id: "i18n-zoned",
  match: (v): v is ZonedDateTime => v instanceof ZonedDateTime,
  serialize: (v) => ({ iso: v.toAbsoluteString(), tz: v.timeZone }),
  deserialize: (d: any) => parseAbsolute(d.iso, d.tz),
})

registerValueSerializer({
  id: "incomplete-date",
  match: (v): v is IncompleteDate => v instanceof IncompleteDate,
  serialize: (v) => ({
    cal: v.calendar.identifier,
    hc: v.hourCycle,
    f: [v.era, v.year, v.month, v.day, v.hour, v.dayPeriod, v.minute, v.second, v.millisecond, v.offset],
  }),
  deserialize: (d: any) => {
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
  serialize: (v) => v.toString("css"),
  deserialize: (s) => parseColor(s as string),
})

/**
 * The registrations above are module side effects; the qwik optimizer drops
 * unreferenced side-effect imports when extracting component$ chunks, so
 * pages call this (before useMachine) to keep the module in their graph.
 */
export function ensureSerializersRegistered() {}
