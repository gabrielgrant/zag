import { SerializerSymbol } from "@qwik.dev/core"

/**
 * Machine context values live in Qwik signals so SSR state resumes for free —
 * but Qwik can only serialize plain data. Some machines keep class instances
 * in context (date-picker's `DateValue`, color-picker's `Color`); a registered
 * serializer lets the bindable store the serialized form in the signal and
 * reconstruct it on read, making those machines SSR-resumable.
 *
 * The codec shape mirrors Qwik's own `SerializerArgObject` (`serialize` /
 * `deserialize`, with `serialize` optional and falling back to a value's
 * `[SerializerSymbol]`). It adds `id` + `match` because, unlike Qwik's
 * call-site-typed `useSerializer$`, this adapter is generic: the machine — not
 * the adapter — decides what a context slot holds, so codecs are dispatched by
 * a runtime `match` predicate and tagged by `id` for reconstruction.
 *
 * Registration is module-level (the registry is consulted by every machine on
 * the page); register from app code before rendering the machine, e.g.:
 *
 * ```ts
 * registerValueSerializer({
 *   id: "date",
 *   match: (v) => v instanceof CalendarDate,
 *   serialize: (v) => v.toString(),
 *   deserialize: (s) => parseDate(s),
 * })
 * ```
 */
export interface ValueSerializer<T = any, E = unknown> {
  /** unique id, stored alongside the serialized value */
  id: string
  match(value: unknown): value is T
  /**
   * Serialize to a Qwik-serializable form. Optional: if omitted and the value
   * carries a `[SerializerSymbol]` method, that is used instead — mirroring
   * Qwik's `SerializerArgObject.serialize`.
   */
  serialize?(value: T): E
  deserialize(data: E): T
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

function runSerialize(serializer: ValueSerializer, value: unknown): unknown {
  if (serializer.serialize) return serializer.serialize(value)
  // mirror Qwik: with no `serialize`, defer to the value's [SerializerSymbol]
  const symbolFn = (value as any)?.[SerializerSymbol]
  return typeof symbolFn === "function" ? symbolFn.call(value, value) : undefined
}

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
      return { [MARK]: serializer.id, d: runSerialize(serializer, value) } satisfies Encoded
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
  return serializer.deserialize(value.d)
}
