/**
 * Machine context values live in Qwik signals so SSR state resumes for free —
 * but Qwik can only serialize plain data. Some machines keep class instances
 * in context (date-picker's `DateValue`, color-picker's `Color`); a registered
 * serializer lets the bindable store the encoded form in the signal and decode
 * on read, making those machines SSR-resumable.
 *
 * Registration is module-level (the registry is consulted by every machine on
 * the page); register from app code before rendering the machine, e.g.:
 *
 * ```ts
 * registerValueSerializer({
 *   id: "date",
 *   match: (v) => v instanceof CalendarDate,
 *   encode: (v) => v.toString(),
 *   decode: (s) => parseDate(s),
 * })
 * ```
 */
export interface ValueSerializer<T = any, E = unknown> {
  /** unique id, stored alongside the encoded value */
  id: string
  match(value: unknown): value is T
  encode(value: T): E
  decode(data: E): T
}

const registry: ValueSerializer[] = []

export function registerValueSerializer(serializer: ValueSerializer) {
  const existing = registry.findIndex((s) => s.id === serializer.id)
  if (existing !== -1) registry.splice(existing, 1, serializer)
  else registry.push(serializer)
}

const MARK = "__zag_encoded__"

interface Encoded {
  [MARK]: string
  d: unknown
}

const isEncoded = (v: unknown): v is Encoded => typeof v === "object" && v !== null && MARK in v

export function encodeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    let changed = false
    const out = value.map((item) => {
      const encoded = encodeValue(item)
      if (encoded !== item) changed = true
      return encoded
    })
    return changed ? ({ [MARK]: "$array", d: out } satisfies Encoded) : value
  }
  for (const serializer of registry) {
    if (serializer.match(value)) {
      return { [MARK]: serializer.id, d: serializer.encode(value) } satisfies Encoded
    }
  }
  return value
}

export function decodeValue(value: unknown): unknown {
  if (!isEncoded(value)) return value
  if (value[MARK] === "$array") return (value.d as unknown[]).map(decodeValue)
  const serializer = registry.find((s) => s.id === value[MARK])
  if (!serializer) {
    console.warn(`[zag-js/qwik] no value serializer registered for "${value[MARK]}" — did the registering module load?`)
    return value
  }
  return serializer.decode(value.d)
}
