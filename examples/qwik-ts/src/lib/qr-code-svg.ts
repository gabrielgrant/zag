/**
 * Qwik marks every SSR-rendered element with an empty `:` attribute (its
 * props separator). `XMLSerializer` emits it verbatim (`:=""`), which is not
 * well-formed namespaced XML, so an SVG serialized by zag's `getDataUrl()`
 * never loads as an image and the returned promise never settles.
 *
 * `hideQwikMarkers` removes those markers from `svg` and its descendants and
 * returns a function that puts them back. `getDataUrl()` clones the svg
 * synchronously, so the markers only need to be gone while it is called.
 */
export function hideQwikMarkers(svg: Element | null | undefined): () => void {
  const marked = svg ? [svg, ...Array.from(svg.querySelectorAll("*"))].filter((el) => el.hasAttribute(":")) : []
  const values = marked.map((el) => el.getAttribute(":") ?? "")
  marked.forEach((el) => el.removeAttribute(":"))
  return () => marked.forEach((el, i) => el.setAttribute(":", values[i]))
}

export function withoutQwikMarkers<T>(svg: Element | null | undefined, fn: () => T): T {
  const restore = hideQwikMarkers(svg)
  try {
    return fn()
  } finally {
    restore()
  }
}
