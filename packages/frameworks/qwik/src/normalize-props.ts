import { createNormalizer } from "@zag-js/types"
import type { CSSProperties, HTMLElementAttrs, QwikIntrinsicElements } from "@qwik.dev/core"
import { isServer } from "@qwik.dev/core/build"
import { getWakeHandler } from "./wake-context"

type Dict = Record<string, any>

export type PropTypes = {
  button: QwikIntrinsicElements["button"]
  label: QwikIntrinsicElements["label"]
  input: QwikIntrinsicElements["input"]
  textarea: QwikIntrinsicElements["textarea"]
  img: QwikIntrinsicElements["img"]
  output: QwikIntrinsicElements["output"]
  element: HTMLElementAttrs & Dict
  select: QwikIntrinsicElements["select"]
  rect: QwikIntrinsicElements["rect"]
  style: CSSProperties
  circle: QwikIntrinsicElements["circle"]
  svg: QwikIntrinsicElements["svg"]
  path: QwikIntrinsicElements["path"]
}

/**
 * Qwik prefers HTML-native names; there are no synthetic events, so React-ish
 * event aliases are mapped to their native DOM counterparts (with Qwik's `$`
 * suffix appended below).
 */
const propMap: Dict = {
  className: "class",
  defaultChecked: "checked",
  defaultValue: "value",
  htmlFor: "for",
  onBlur: "onFocusOut",
  onChange: "onInput",
  onFocus: "onFocusIn",
  onDoubleClick: "onDblClick",
}

const isEventProp = (key: string) => key.startsWith("on") && key.charCodeAt(2) >= 65 && key.charCodeAt(2) <= 90

/**
 * Qwik dispatches events from root-level listeners, so `event.currentTarget`
 * is not the element the handler was declared on. Zag handlers rely on
 * `currentTarget`, so it is re-pointed at the element Qwik passes as the
 * second handler argument. The wrapper is fully synchronous, preserving
 * same-turn `preventDefault()`.
 */
function wrapHandler(fn: (event: Event) => void) {
  return (event: Event, element: Element) => {
    if (event.currentTarget !== element) {
      try {
        Object.defineProperty(event, "currentTarget", { value: element, configurable: true })
      } catch {
        // some synthetic events may not allow redefinition; fall through
      }
    }
    return fn(event)
  }
}

/**
 * Attribute names must be emitted in their HTML-native (lowercase) form:
 * Qwik's client diff compares against attribute keys read back from the
 * SSR DOM, which are lowercase — camelCase keys would be treated as new
 * props and the lowercase ones removed as stale.
 */
const preserveKeys = new Set(
  "children,dangerouslySetInnerHTML,ref,key,viewBox,preserveAspectRatio,fillRule,clipPath,clipRule,strokeWidth,strokeLinecap,strokeLinejoin,strokeDasharray,strokeDashoffset,strokeMiterlimit".split(
    ",",
  ),
)

function toQwikProp(key: string) {
  if (key in propMap) return propMap[key]
  if (preserveKeys.has(key)) return key
  return key.toLowerCase()
}

export const normalizeProps = createNormalizer<PropTypes>((props) => {
  const normalized: Dict = {}

  for (const key in props) {
    const value = props[key]

    if (isEventProp(key) && typeof value === "function") {
      if (isServer) {
        // Plain handlers can't be serialized into SSR output. Emit the
        // machine's wake QRL instead: qwikloader then announces this event
        // type, captures pre-wake interactions, and the wake QRL replays
        // them into the live handler once the activation render commits.
        const wake = getWakeHandler()
        if (wake) normalized[`${propMap[key] ?? key}$`] = wake
        continue
      }
      // On the client, Qwik registers plain functions for synchronous
      // dispatch (conditional preventDefault inside zag handlers works).
      normalized[`${propMap[key] ?? key}$`] = wrapHandler(value)
      continue
    }

    normalized[toQwikProp(key)] = value
  }

  return normalized
})
