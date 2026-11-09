import { createNormalizer } from "@zag-js/types"
import type { CSSProperties, HTMLElementAttrs, QwikIntrinsicElements } from "@qwik.dev/core"
import { isServer } from "@qwik.dev/core/build"
import { preserveElementStyles, toStyleString } from "./style"
import { getWakeHandler } from "./wake-context"
import { enqueueDeferred, isReplayDraining } from "./wake-replay"

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
    const invoke = () => {
      if (event.currentTarget !== element) {
        try {
          Object.defineProperty(event, "currentTarget", { value: element, configurable: true })
        } catch {
          // some synthetic events may not allow redefinition; fall through
        }
      }
      return fn(event)
    }

    // A pre-wake event for some component is still being replayed in FIFO
    // order (see wake-replay). If the eager wake completed mid-sequence, this
    // live handler must not overtake the queued earlier event — defer it
    // behind the drain so the machine sees events in DOM order. Rare (only
    // during the brief wake window); the lost same-turn preventDefault matches
    // the pre-wake interaction limitation already documented for the wake QRL.
    if (isReplayDraining()) {
      enqueueDeferred(invoke)
      return
    }

    // Qwik dispatches from a document-level CAPTURE listener, so handlers
    // would run before zag's own document-capture utilities (escape
    // trackers, dismissable layers) — the reverse of element-attached (and
    // React root-bubble) ordering, which zag's connects are written
    // against. Re-attach for the same in-flight dispatch at the element so
    // the handler runs in its native slot (target/bubble phase): still
    // synchronous within the dispatch, so conditional preventDefault keeps
    // working, and a handler's stopPropagation no longer starves zag's
    // document-capture listeners.
    if (event.eventPhase === Event.CAPTURING_PHASE && event.currentTarget !== element && event.bubbles) {
      const once = () => invoke()
      element.addEventListener(event.type, once, { once: true })
      // if propagation is stopped before reaching the element (native
      // element-listener semantics), disarm so the stale closure cannot
      // fire on a future event. Must be a macrotask: microtask checkpoints
      // run BETWEEN listener invocations of this same dispatch and would
      // disarm before the event reaches the element.
      setTimeout(() => element.removeEventListener(event.type, once))
      return
    }

    // non-bubbling events only dispatch on their target (element === target
    // here), at-target/bubble dispatches are already in their native slot,
    // and wake-replayed events (eventPhase NONE) have finished propagating
    return invoke()
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

/**
 * `defaultValue` / `defaultChecked` are initial values: zag writes later
 * changes to the element itself (as React only applies them on mount). Mapped
 * to Qwik's `value` / `checked`, every change would be written back on the next
 * render and could overwrite what the user is typing (a number input showing
 * "0.25" for a typed ".25"). On the client, keep emitting the value the element
 * was created with, so Qwik never re-applies it. Elements are identified by
 * their id: a part not in the document yet is being created and takes the
 * current value; a server-rendered one keeps the value it was rendered with.
 */
const pendingInitial = new Map<string, unknown>()
const initialByElement = new WeakMap<Element, unknown>()

function initialValue(id: unknown, key: "defaultValue" | "defaultChecked", value: unknown) {
  if (typeof id !== "string" || !id) return value
  const el = document.getElementById(id)
  if (!el) {
    pendingInitial.set(id, value)
    return value
  }
  if (initialByElement.has(el)) return initialByElement.get(el)
  let initial: unknown
  if (pendingInitial.has(id)) {
    initial = pendingInitial.get(id)
    pendingInitial.delete(id)
  } else {
    // resumed from SSR: the rendered attribute is what Qwik's vnode holds
    initial = key === "defaultChecked" ? el.hasAttribute("checked") : (el.getAttribute("value") ?? value)
  }
  initialByElement.set(el, initial)
  return initial
}

export const normalizeProps = createNormalizer<PropTypes>((props) => {
  const normalized: Dict = {}

  for (const key in props) {
    const value = props[key]

    if (isEventProp(key) && typeof value === "function") {
      // a part that also handles `onInput` (e.g. the hidden select, which
      // must react to autofill's `change`) means the native change event
      const name = key === "onChange" && "onInput" in props ? key : (propMap[key] ?? key)
      if (isServer) {
        // Plain handlers can't be serialized into SSR output. Emit the
        // machine's wake QRL instead: qwikloader then announces this event
        // type, captures pre-wake interactions, and the wake QRL replays
        // them into the live handler once the activation render commits.
        const wake = getWakeHandler()
        if (wake) normalized[`${name}$`] = wake
        continue
      }
      // On the client, Qwik registers plain functions for synchronous
      // dispatch (conditional preventDefault inside zag handlers works).
      normalized[`${name}$`] = wrapHandler(value)
      continue
    }

    if (key === "style" && typeof value === "object" && value !== null) {
      // see style.ts: Qwik rewrites the whole attribute when it changes
      if (!isServer) preserveElementStyles()
      normalized.style = toStyleString(value)
      continue
    }

    if (!isServer && (key === "defaultValue" || key === "defaultChecked")) {
      normalized[toQwikProp(key)] = initialValue(props.id, key, value)
      continue
    }

    normalized[toQwikProp(key)] = value
  }

  return normalized
})
