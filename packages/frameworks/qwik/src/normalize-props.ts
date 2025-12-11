import { createNormalizer } from "@zag-js/types"
import { $, sync$, type QRL } from "@builder.io/qwik"
import type { JSX } from "@builder.io/qwik"

type Dict = Record<string, any>

/**
 * Qwik-specific JSX types for prop normalization
 */
export type PropTypes = JSX.IntrinsicElements & {
  element: JSX.IntrinsicElements["div"]
  style: Record<string, any>
}

/**
 * Event names that commonly require preventDefault
 */
const PREVENT_DEFAULT_EVENTS = new Set([
  "onClick",
  "onMouseDown",
  "onKeyDown",
  "onKeyUp",
  "onSubmit",
  "onDragStart",
  "onDrop",
  "onContextMenu",
])

/**
 * Maps React-style event names to Qwik-style event names
 * Note: Most events (onClick, onMouseDown, etc.) work with just adding $ suffix
 * Only special cases that have different names need mapping
 */
const eventMap: Record<string, string> = {
  onDoubleClick: "onDblClick$",
  onChange: "onInput$",
  onFocus: "onFocusIn$",
  onBlur: "onFocusOut$",
}

/**
 * Checks if a value is a function that might need preventDefault
 */
function isEventHandler(key: string, value: any): boolean {
  return key.startsWith("on") && typeof value === "function"
}

/**
 * Wraps event handler in QRL (Qwik Resource Locator) if needed
 * Note: In practice, handlers from Zag machines are plain functions
 * and always need wrapping. The QRL check is defensive programming.
 */
function wrapEventHandler(handler: Function): QRL<(event: any) => void> {
  // If already wrapped (defensive check), return as is
  // Note: This is a heuristic - Qwik QRLs have internal structure
  if (typeof handler === "object" && handler !== null) {
    return handler as QRL<(event: any) => void>
  }
  // Wrap in $ to create QRL
  return $((event: any) => handler(event))
}

/**
 * Approach 1: Basic QRL wrapping
 * This is the simplest approach - just wrap handlers in QRLs
 */
export const normalizePropsBasic = createNormalizer<PropTypes>((props: Dict) => {
  const normalized: Dict = {}

  for (const key in props) {
    const value = props[key]

    if (key === "children") {
      if (typeof value === "string") {
        normalized["innerHTML"] = value
      }
      continue
    }

    // Handle event handlers - wrap in QRL
    if (isEventHandler(key, value)) {
      const qwikKey = eventMap[key] || key + "$"
      normalized[qwikKey] = wrapEventHandler(value)
      continue
    }

    normalized[key] = value
  }

  return normalized
})

/**
 * Approach 2: Auto-detect preventDefault with sync$ wrapper
 * Automatically wraps handlers that call preventDefault
 */
export const normalizePropsAutoPrevent = createNormalizer<PropTypes>((props: Dict) => {
  const normalized: Dict = {}

  for (const key in props) {
    const value = props[key]

    if (key === "children") {
      if (typeof value === "string") {
        normalized["innerHTML"] = value
      }
      continue
    }

    // Handle event handlers
    if (isEventHandler(key, value)) {
      const qwikKey = eventMap[key] || key + "$"

      // Check if this is an event that commonly needs preventDefault
      if (PREVENT_DEFAULT_EVENTS.has(key)) {
        // Convert handler to string to check for preventDefault
        // NOTE: This is a heuristic that may have false positives/negatives
        // - False negative: preventDefault in conditionals may not be detected
        // - False positive: Comments or strings containing "preventDefault"
        // For complex cases, use normalizePropsManual or helper functions
        const handlerStr = value.toString()
        const hasPreventDefault = handlerStr.includes("preventDefault")

        if (hasPreventDefault) {
          // Add declarative preventDefault attribute
          const eventName = key.slice(2).toLowerCase() // onClick -> click
          normalized[`preventdefault:${eventName}`] = true

          // Still wrap the handler
          normalized[qwikKey] = wrapEventHandler(value)
        } else {
          normalized[qwikKey] = wrapEventHandler(value)
        }
      } else {
        normalized[qwikKey] = wrapEventHandler(value)
      }
      continue
    }

    normalized[key] = value
  }

  return normalized
})

/**
 * Approach 3: Manual control with metadata
 * Users can pass metadata to control preventDefault behavior
 * Usage: { onClick: handler, "data-prevent-default": "click" }
 */
export const normalizePropsManual = createNormalizer<PropTypes>((props: Dict) => {
  const normalized: Dict = {}
  const preventDefaults = new Set<string>()

  // First pass: collect prevent-default metadata
  for (const key in props) {
    if (key === "data-prevent-default") {
      const events = Array.isArray(props[key]) ? props[key] : [props[key]]
      events.forEach((e: string) => preventDefaults.add(e))
    }
  }

  // Second pass: normalize props
  for (const key in props) {
    const value = props[key]

    if (key === "children") {
      if (typeof value === "string") {
        normalized["innerHTML"] = value
      }
      continue
    }

    if (key === "data-prevent-default") {
      // Don't include this in normalized props
      continue
    }

    // Handle event handlers
    if (isEventHandler(key, value)) {
      const eventName = key.slice(2).toLowerCase() // onClick -> click
      const qwikKey = eventMap[key] || key + "$"

      // Add preventDefault attribute if specified
      if (preventDefaults.has(eventName)) {
        normalized[`preventdefault:${eventName}`] = true
      }

      normalized[qwikKey] = wrapEventHandler(value)
      continue
    }

    normalized[key] = value
  }

  return normalized
})

/**
 * Default export uses auto-detect approach as it provides best balance
 * of convenience and functionality
 */
export const normalizeProps = normalizePropsAutoPrevent

/**
 * Helper to create a sync$ wrapper for conditional preventDefault
 * This is useful when you need to prevent default based on runtime conditions
 *
 * @example
 * const handler = createConditionalPreventDefault(
 *   (event, target) => event.ctrlKey, // condition
 *   (event) => { ... } // async handler
 * )
 */
export function createConditionalPreventDefault<E = Event>(
  condition: (event: E, target: HTMLElement) => boolean,
  handler: (event: E) => void | Promise<void>,
): Array<QRL<(event: E, target: HTMLElement) => void> | QRL<(event: E) => void>> {
  return [
    sync$((event: E, target: HTMLElement) => {
      if (condition(event, target)) {
        ;(event as any).preventDefault()
      }
    }),
    $((event: E) => handler(event)),
  ]
}

/**
 * Helper to create a sync$ wrapper that checks data attribute
 * This allows passing state via attributes for conditional preventDefault
 *
 * @example
 * <button
 *   data-should-prevent="true"
 *   onClick$={createAttributePreventDefault('data-should-prevent', handleClick)}
 * >
 */
export function createAttributePreventDefault<E = Event>(
  attributeName: string,
  handler: (event: E) => void | Promise<void>,
): Array<QRL<(event: E, target: HTMLElement) => void> | QRL<(event: E) => void>> {
  return [
    sync$((event: E, target: HTMLElement) => {
      if (target.hasAttribute(attributeName)) {
        ;(event as any).preventDefault()
      }
    }),
    $((event: E) => handler(event)),
  ]
}
