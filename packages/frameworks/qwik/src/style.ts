/**
 * Style handling for zag parts.
 *
 * Machines write some styles straight onto elements (popper's `--x`, `--y`,
 * `--z-index`, measured sizes, ...). React, Vue, Solid and Svelte apply a style
 * prop one property at a time, so those writes survive re-renders. Qwik
 * re-serializes the whole `style` attribute whenever the style prop changes,
 * which drops them, and popper skips re-writing values it believes are
 * already set (a menu then renders at the top-left).
 *
 * There is no hook between Qwik writing the attribute and the browser painting
 * that a prop could use (`ref` runs while diffing, before DOM writes are
 * applied, and would also collide with a consumer's own `ref`). Instead, one
 * document-level MutationObserver watches the `style` attribute of zag parts,
 * remembers the properties written by anything other than the framework, and
 * restores them after the framework re-serializes the attribute — giving the
 * same per-property semantics as the other adapters. The observer runs as a
 * microtask, before the next paint.
 */

type StyleObject = Record<string, number | string | null | undefined>

const toCssName = (key: string) =>
  key.startsWith("--") ? key : key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)

/**
 * Serializes in the compact `name:value;` form. Besides diffing as unchanged
 * when connect returns an equal style object, the compact form is how
 * framework writes are told apart from CSSOM writes (`name: value;`).
 */
export function toStyleString(style: StyleObject) {
  let string = ""
  for (const key in style) {
    const value = style[key]
    if (value === null || value === undefined) continue
    string += `${toCssName(key)}:${value};`
  }
  return string
}

type Declarations = Map<string, string>

interface ElementStyles {
  /** properties in the framework's last write; undefined until one is seen */
  own: Set<string> | undefined
  /** properties written by others since, which a framework write would drop */
  foreign: Declarations
}

const elements = new WeakMap<Element, ElementStyles>()

let scratch: HTMLElement | undefined

/** Parses a style attribute with the browser's own CSS parser */
function parse(value: string | null): Declarations {
  const declarations: Declarations = new Map()
  if (!value) return declarations
  scratch ??= document.createElement("div")
  scratch.setAttribute("style", value)
  const style = scratch.style
  for (let i = 0; i < style.length; i++) {
    const name = style[i]!
    declarations.set(name, style.getPropertyValue(name))
  }
  return declarations
}

/**
 * A framework write sets the attribute to a `toStyleString` (or Qwik
 * `stringifyStyle`) result; CSSOM writes serialize as `name: value`.
 */
const isFrameworkWrite = (value: string | null) => value !== null && !value.includes(": ")

function track(element: HTMLElement, oldValue: string | null, newValue: string | null, restore: Set<HTMLElement>) {
  let state = elements.get(element)
  if (!state) {
    state = { own: isFrameworkWrite(oldValue) ? new Set(parse(oldValue).keys()) : undefined, foreign: new Map() }
    elements.set(element, state)
  }

  const prev = parse(oldValue)
  const next = parse(newValue)

  if (isFrameworkWrite(newValue)) {
    if (!state.own) {
      // other writes happened before this element was first seen; custom
      // properties are what machines write, and keeping anything else could
      // resurrect a declaration the framework meant to drop
      for (const [name, value] of prev) {
        if (name.startsWith("--") && !next.has(name)) state.foreign.set(name, value)
      }
    }
    const own = new Set(next.keys())
    for (const name of state.foreign.keys()) {
      // the framework's own declarations win, as with per-property updates
      if (own.has(name) || state.own?.has(name)) state.foreign.delete(name)
    }
    state.own = own
    if (state.foreign.size) restore.add(element)
    return
  }

  for (const [name, value] of next) {
    if (prev.get(name) !== value) state.foreign.set(name, value)
  }
  for (const name of prev.keys()) {
    if (!next.has(name)) state.foreign.delete(name)
  }
}

function onMutations(records: MutationRecord[]) {
  // the value a record produced is the old value of the element's next record
  // in the batch, or the current value for its last one
  const newValues: (string | null)[] = []
  const following = new Map<Node, string | null>()
  for (let i = records.length - 1; i >= 0; i--) {
    const { target, oldValue } = records[i]!
    newValues[i] = following.has(target) ? following.get(target)! : (target as Element).getAttribute("style")
    following.set(target, oldValue)
  }

  const restore = new Set<HTMLElement>()
  for (let i = 0; i < records.length; i++) {
    const element = records[i]!.target as HTMLElement
    if (!element.hasAttribute("data-scope")) continue
    track(element, records[i]!.oldValue, newValues[i]!, restore)
  }
  for (const element of restore) {
    const { foreign } = elements.get(element)!
    for (const [name, value] of foreign) {
      if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value)
    }
  }
}

let observing = false

/** Starts preserving machine-written styles; idempotent, client only */
export function preserveElementStyles() {
  if (observing || typeof MutationObserver === "undefined") return
  observing = true
  new MutationObserver(onMutations).observe(document, {
    subtree: true,
    attributes: true,
    attributeFilter: ["style"],
    attributeOldValue: true,
  })
}
