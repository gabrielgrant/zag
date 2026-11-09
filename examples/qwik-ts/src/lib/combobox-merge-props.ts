import { isServer } from "@qwik.dev/core/build"
import { mergeProps } from "@zag-js/qwik"

type Dict = Record<string, any>

const isHandlerKey = (key: string) => key.startsWith("on") && key.endsWith("$")

// Qwik QRLs are callable; plain functions can't be serialized into SSR output
const isQrl = (value: unknown) => typeof value === "function" && "getSymbol" in value

/**
 * `mergeProps` for props that went through the Qwik `normalizeProps` (event
 * handlers are `$`-suffixed). Handlers are combined into a Qwik handler array
 * instead of a `callAll` closure: during SSR they are the machines' wake QRLs,
 * which must stay serializable. Like `mergeProps`, a later argument's handler
 * runs first. Plain-function handlers (the page's own, which may use a machine
 * api) are client-only and skipped during SSR.
 */
export function mergeQwikProps(...args: Array<Dict | undefined>): Dict {
  const handlers: Record<string, unknown[]> = {}
  const rest = args.map((props) => {
    const result: Dict = {}
    for (const key in props) {
      const value = props[key]
      if (isHandlerKey(key)) {
        if (value == null || (isServer && !isQrl(value))) continue
        ;(handlers[key] ??= []).unshift(value)
        continue
      }
      result[key] = value
    }
    return result
  })
  const merged: Dict = mergeProps(...rest)
  for (const key in handlers) {
    const list = handlers[key]
    merged[key] = list.length === 1 ? list[0] : list
  }
  return merged
}
